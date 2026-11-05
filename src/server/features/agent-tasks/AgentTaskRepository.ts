import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { agentTasks } from "@/db/schema";

export type AgentTask = typeof agentTasks.$inferSelect;

export const AGENT_TASK_TYPES = [
  "search_console",
  "site_audit",
  "ai_visibility",
  "indexing",
] as const;
export type AgentTaskType = (typeof AGENT_TASK_TYPES)[number];

export type ProposedAgentTask = {
  type: AgentTaskType;
  dedupeKey: string;
  title: string;
  brief: string;
  targetUrl: string | null;
  score: number;
};

// Statuses a person can (re)send to the runner.
const QUEUEABLE = ["proposed", "no_change", "failed", "pr_closed"];
// A runner that died mid-task leaves it claimed; after this long another
// runner may take it again.
const STALE_CLAIM_MS = 60 * 60 * 1000;

const now = () => new Date().toISOString();

async function listForProject(projectId: string): Promise<AgentTask[]> {
  return db
    .select()
    .from(agentTasks)
    .where(eq(agentTasks.projectId, projectId))
    .orderBy(desc(agentTasks.score), desc(agentTasks.createdAt));
}

async function listByStatus(
  projectId: string,
  status: string,
): Promise<AgentTask[]> {
  return db
    .select()
    .from(agentTasks)
    .where(
      and(eq(agentTasks.projectId, projectId), eq(agentTasks.status, status)),
    )
    .orderBy(desc(agentTasks.score));
}

/**
 * Saves what the finder found. New findings are inserted; a finding that is
 * still proposed gets fresh evidence. Anything a person or runner already
 * acted on (queued, done, dismissed) is left alone.
 */
async function saveProposed(
  projectId: string,
  organizationId: string,
  found: ProposedAgentTask[],
): Promise<{ added: number; updated: number }> {
  if (!found.length) return { added: 0, updated: 0 };
  const existing = await db
    .select({
      id: agentTasks.id,
      dedupeKey: agentTasks.dedupeKey,
      status: agentTasks.status,
    })
    .from(agentTasks)
    .where(
      and(
        eq(agentTasks.projectId, projectId),
        inArray(
          agentTasks.dedupeKey,
          found.map((task) => task.dedupeKey),
        ),
      ),
    );
  const byKey = new Map(existing.map((row) => [row.dedupeKey, row]));
  let added = 0;
  let updated = 0;
  for (const task of found) {
    const row = byKey.get(task.dedupeKey);
    if (!row) {
      await db.insert(agentTasks).values({
        id: crypto.randomUUID(),
        projectId,
        organizationId,
        ...task,
      });
      added++;
    } else if (row.status === "proposed") {
      await db
        .update(agentTasks)
        .set({
          title: task.title,
          brief: task.brief,
          targetUrl: task.targetUrl,
          score: task.score,
          updatedAt: now(),
        })
        .where(eq(agentTasks.id, row.id));
      updated++;
    }
  }
  return { added, updated };
}

async function queue(
  projectId: string,
  taskIds: string[],
  userId: string,
): Promise<number> {
  const rows = await db
    .update(agentTasks)
    .set({
      status: "queued",
      queuedByUserId: userId,
      queuedAt: now(),
      prUrl: null,
      note: null,
      updatedAt: now(),
    })
    .where(
      and(
        eq(agentTasks.projectId, projectId),
        inArray(agentTasks.id, taskIds),
        inArray(agentTasks.status, QUEUEABLE),
      ),
    )
    .returning({ id: agentTasks.id });
  return rows.length;
}

async function dismiss(projectId: string, taskIds: string[]): Promise<number> {
  const rows = await db
    .update(agentTasks)
    .set({ status: "dismissed", updatedAt: now() })
    .where(
      and(
        eq(agentTasks.projectId, projectId),
        inArray(agentTasks.id, taskIds),
        inArray(agentTasks.status, [...QUEUEABLE, "queued"]),
      ),
    )
    .returning({ id: agentTasks.id });
  return rows.length;
}

/** Takes a queued task (or a stale claim) for one runner; null if it lost. */
async function claim(
  projectId: string,
  taskId: string,
): Promise<AgentTask | null> {
  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS).toISOString();
  const [row] = await db
    .update(agentTasks)
    .set({ status: "claimed", claimedAt: now(), updatedAt: now() })
    .where(
      and(
        eq(agentTasks.projectId, projectId),
        eq(agentTasks.id, taskId),
        or(
          eq(agentTasks.status, "queued"),
          and(
            eq(agentTasks.status, "claimed"),
            lt(agentTasks.claimedAt, staleBefore),
          ),
        ),
      ),
    )
    .returning();
  return row ?? null;
}

async function complete(
  projectId: string,
  taskId: string,
  result: {
    outcome: "pr_opened" | "no_change" | "failed";
    prUrl: string | null;
    note: string | null;
  },
): Promise<AgentTask | null> {
  const [row] = await db
    .update(agentTasks)
    .set({
      status: result.outcome,
      prUrl: result.prUrl,
      note: result.note,
      completedAt: now(),
      updatedAt: now(),
    })
    .where(
      and(
        eq(agentTasks.projectId, projectId),
        eq(agentTasks.id, taskId),
        eq(agentTasks.status, "claimed"),
      ),
    )
    .returning();
  return row ?? null;
}

/**
 * Records what happened to a task's pull request after a person reviewed it:
 * merged, or closed without merging. Only moves a task out of pr_opened.
 */
async function setPrState(
  projectId: string,
  taskId: string,
  state: "merged" | "pr_closed",
): Promise<AgentTask | null> {
  const [row] = await db
    .update(agentTasks)
    .set({ status: state, updatedAt: now() })
    .where(
      and(
        eq(agentTasks.projectId, projectId),
        eq(agentTasks.id, taskId),
        eq(agentTasks.status, "pr_opened"),
      ),
    )
    .returning();
  return row ?? null;
}

async function get(projectId: string, taskId: string) {
  const [row] = await db
    .select()
    .from(agentTasks)
    .where(and(eq(agentTasks.projectId, projectId), eq(agentTasks.id, taskId)))
    .limit(1);
  return row ?? null;
}

export const AgentTaskRepository = {
  listForProject,
  listByStatus,
  saveProposed,
  queue,
  dismiss,
  setPrState,
  claim,
  complete,
  get,
};
