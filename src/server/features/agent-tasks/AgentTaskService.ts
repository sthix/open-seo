import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { GscNotConnectedError } from "@/server/lib/gscErrors";
import {
  AGENT_TASK_TYPES,
  AgentTaskRepository,
  type AgentTask,
  type AgentTaskType,
  type ProposedAgentTask,
} from "./AgentTaskRepository";
import { findAiVisibilityTasks } from "./aiVisibilityTasks";
import { findIndexingTasks } from "./indexingTasks";
import { findSearchConsoleTasks } from "./searchConsoleTasks";
import { findSiteAuditTasks } from "./siteAuditTasks";

const FINDERS: Record<
  AgentTaskType,
  (projectId: string) => Promise<ProposedAgentTask[]>
> = {
  search_console: findSearchConsoleTasks,
  site_audit: findSiteAuditTasks,
  ai_visibility: findAiVisibilityTasks,
  indexing: findIndexingTasks,
};

type FindTasksResult = {
  added: number;
  updated: number;
  // A finder that failed, e.g. an expired Google grant. Others still run.
  errors: { type: AgentTaskType; message: string }[];
};

/** Runs every finder for a project and saves what they propose. */
async function findTasks(
  projectId: string,
  organizationId: string,
): Promise<FindTasksResult> {
  const results = await Promise.allSettled(
    AGENT_TASK_TYPES.map((type) => FINDERS[type](projectId)),
  );
  const found: ProposedAgentTask[] = [];
  const errors: FindTasksResult["errors"] = [];
  results.forEach((result, index) => {
    const type = AGENT_TASK_TYPES[index];
    if (result.status === "fulfilled") found.push(...result.value);
    // A project without Search Console simply has no Search Console tasks.
    else if (!(result.reason instanceof GscNotConnectedError))
      errors.push({
        type,
        message:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
  });
  const saved = await AgentTaskRepository.saveProposed(
    projectId,
    organizationId,
    found,
  );
  return { ...saved, errors };
}

/**
 * The nightly check: runs the finders for every active project, one at a
 * time so Google and the database see a gentle load. One project's failure
 * doesn't stop the others.
 */
async function findTasksForAllProjects() {
  const active = await db
    .select({ id: projects.id, organizationId: projects.organizationId })
    .from(projects)
    .where(isNull(projects.archivedAt));
  for (const project of active) {
    try {
      const result = await findTasks(project.id, project.organizationId);
      if (result.added || result.errors.length)
        console.log("[agent-tasks] found tasks", project.id, result);
    } catch (error) {
      console.error("[agent-tasks] finding tasks failed", project.id, error);
    }
  }
}

/** What the runner and the UI see of a task. */
export function toAgentTaskView(task: AgentTask) {
  return {
    id: task.id,
    type: task.type,
    title: task.title,
    brief: task.brief,
    targetUrl: task.targetUrl,
    score: task.score,
    status: task.status,
    prUrl: task.prUrl,
    note: task.note,
    queuedAt: task.queuedAt,
    completedAt: task.completedAt,
    updatedAt: task.updatedAt,
  };
}

export const AgentTaskService = {
  findTasks,
  findTasksForAllProjects,
  list: async (projectId: string) =>
    (await AgentTaskRepository.listForProject(projectId)).map(toAgentTaskView),
  queue: AgentTaskRepository.queue,
  dismiss: AgentTaskRepository.dismiss,
};
