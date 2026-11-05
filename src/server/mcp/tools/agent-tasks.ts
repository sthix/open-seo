import { z } from "zod";
import { AgentTaskRepository } from "@/server/features/agent-tasks/AgentTaskRepository";
import { toAgentTaskView } from "@/server/features/agent-tasks/AgentTaskService";
import { buildProjectMeta } from "@/server/mcp/context";
import { mcpResponse } from "@/server/mcp/formatters";
import {
  looseObjectOutputSchema,
  optionalMetaOutputSchema,
} from "@/server/mcp/output-schemas";
import { withMcpProjectAuth } from "@/server/mcp/project-auth";
import { projectIdSchema } from "@/server/mcp/schemas";
import { AppError } from "@/server/lib/errors";

// Tools for a coding-agent runner (runner/ in the agency repo): it lists the
// tasks a person queued in OpenSEO, claims one, does it in the site's
// repository and reports the pull request back.
const tasksPath = (projectId: string) => `/p/${projectId}/tasks`;

const listInputSchema = {
  projectId: projectIdSchema,
  status: z
    .enum(["queued", "pr_opened"])
    .default("queued")
    .describe(
      "queued: the tasks a person approved, to work on. pr_opened: tasks whose pull request is waiting for review, to check whether it was merged or closed.",
    ),
} as const;

export const listAgentTasksTool = {
  name: "list_agent_tasks",
  config: {
    title: "List queued agent tasks",
    description:
      "Lists the coding tasks a person queued for this project in OpenSEO's Tasks page, highest value first. Each task has a markdown brief with what to change in the site's repository and the evidence. Claim a task with claim_agent_task before working on it. Uses no credits.",
    inputSchema: listInputSchema,
    outputSchema: z
      .object({
        tasks: z.array(looseObjectOutputSchema),
        ...optionalMetaOutputSchema,
      })
      .passthrough(),
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  handler: withMcpProjectAuth(
    async (args: z.infer<z.ZodObject<typeof listInputSchema>>, context) => {
      const tasks = (
        await AgentTaskRepository.listByStatus(args.projectId, args.status)
      ).map(toAgentTaskView);
      return mcpResponse({
        text: tasks.length
          ? tasks.map((task) => `- ${task.id}  ${task.title}`).join("\n")
          : "No queued tasks.",
        meta: buildProjectMeta(
          context,
          args.projectId,
          tasksPath(args.projectId),
        ),
        structuredContent: { tasks },
      });
    },
  ),
};

const taskInputSchema = {
  projectId: projectIdSchema,
  taskId: z.string().min(1),
} as const;

export const claimAgentTaskTool = {
  name: "claim_agent_task",
  config: {
    title: "Claim an agent task",
    description:
      "Claims a queued task so no other runner works on it. Returns claimed: false if it's no longer queued (another runner took it, or a person dismissed it); skip it then. A claim that isn't completed within an hour can be claimed again. Uses no credits.",
    inputSchema: taskInputSchema,
    outputSchema: z
      .object({
        claimed: z.boolean(),
        task: looseObjectOutputSchema.nullable(),
        ...optionalMetaOutputSchema,
      })
      .passthrough(),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
  handler: withMcpProjectAuth(
    async (args: z.infer<z.ZodObject<typeof taskInputSchema>>, context) => {
      const claimed = await AgentTaskRepository.claim(
        args.projectId,
        args.taskId,
      );
      const task =
        claimed ?? (await AgentTaskRepository.get(args.projectId, args.taskId));
      return mcpResponse({
        text: claimed
          ? `Claimed: ${claimed.title}`
          : "Not claimed: the task is no longer queued.",
        meta: buildProjectMeta(
          context,
          args.projectId,
          tasksPath(args.projectId),
        ),
        structuredContent: {
          claimed: Boolean(claimed),
          task: task ? toAgentTaskView(task) : null,
        },
      });
    },
  ),
};

const completeInputSchema = {
  ...taskInputSchema,
  outcome: z
    .enum(["pr_opened", "no_change", "failed"])
    .describe(
      "pr_opened: a pull request is open for review. no_change: the task needed no change or shouldn't be done (explain in note). failed: the change or its checks failed (put the error in note).",
    ),
  prUrl: z.string().url().max(500).optional(),
  note: z.string().max(2000).optional(),
} as const;

export const completeAgentTaskTool = {
  name: "complete_agent_task",
  config: {
    title: "Complete an agent task",
    description:
      "Reports the result of a claimed task: the pull request, or why nothing changed or what failed. The Tasks page shows it to the person who queued it. Uses no credits.",
    inputSchema: completeInputSchema,
    outputSchema: z
      .object({
        task: looseObjectOutputSchema,
        ...optionalMetaOutputSchema,
      })
      .passthrough(),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  handler: withMcpProjectAuth(
    async (args: z.infer<z.ZodObject<typeof completeInputSchema>>, context) => {
      if (args.outcome === "pr_opened" && !args.prUrl)
        throw new AppError("VALIDATION_ERROR", "pr_opened needs a prUrl.");
      const task = await AgentTaskRepository.complete(
        args.projectId,
        args.taskId,
        {
          outcome: args.outcome,
          prUrl: args.prUrl ?? null,
          note: args.note ?? null,
        },
      );
      if (!task)
        throw new AppError(
          "VALIDATION_ERROR",
          "Only a claimed task can be completed. Claim it first.",
        );
      return mcpResponse({
        text: `${task.title}: ${task.status}${task.prUrl ? ` (${task.prUrl})` : ""}`,
        meta: buildProjectMeta(
          context,
          args.projectId,
          tasksPath(args.projectId),
        ),
        structuredContent: { task: toAgentTaskView(task) },
      });
    },
  ),
};

const prStateInputSchema = {
  ...taskInputSchema,
  state: z
    .enum(["merged", "closed"])
    .describe(
      "merged: a person merged the task's pull request. closed: it was closed without merging; the person can send the task again.",
    ),
} as const;

export const setAgentTaskPrStateTool = {
  name: "set_agent_task_pr_state",
  config: {
    title: "Record an agent task's PR result",
    description:
      "Records that a pr_opened task's pull request was merged or closed without merging, so the Tasks page shows it. Returns updated: false if the task isn't pr_opened. Uses no credits.",
    inputSchema: prStateInputSchema,
    outputSchema: z
      .object({
        updated: z.boolean(),
        task: looseObjectOutputSchema.nullable(),
        ...optionalMetaOutputSchema,
      })
      .passthrough(),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  handler: withMcpProjectAuth(
    async (args: z.infer<z.ZodObject<typeof prStateInputSchema>>, context) => {
      const updated = await AgentTaskRepository.setPrState(
        args.projectId,
        args.taskId,
        args.state === "merged" ? "merged" : "pr_closed",
      );
      const task =
        updated ?? (await AgentTaskRepository.get(args.projectId, args.taskId));
      return mcpResponse({
        text: updated
          ? `${updated.title}: ${updated.status}`
          : "Not updated: the task is not pr_opened.",
        meta: buildProjectMeta(
          context,
          args.projectId,
          tasksPath(args.projectId),
        ),
        structuredContent: {
          updated: Boolean(updated),
          task: task ? toAgentTaskView(task) : null,
        },
      });
    },
  ),
};
