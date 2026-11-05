import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AgentTaskService } from "@/server/features/agent-tasks/AgentTaskService";
import { requireProjectContext } from "@/serverFunctions/middleware";

const project = z.object({ projectId: z.string().min(1) });
const taskIds = project.extend({
  taskIds: z.array(z.string().min(1)).min(1).max(100),
});

export const listAgentTasks = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(project)
  .handler(({ context }) => AgentTaskService.list(context.projectId));

export const findAgentTasks = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(project)
  .handler(({ context }) =>
    AgentTaskService.findTasks(context.projectId, context.organizationId),
  );

export const queueAgentTasks = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(taskIds)
  .handler(async ({ context, data }) => ({
    queued: await AgentTaskService.queue(
      context.projectId,
      data.taskIds,
      context.userId,
    ),
  }));

export const dismissAgentTasks = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(taskIds)
  .handler(async ({ context, data }) => ({
    dismissed: await AgentTaskService.dismiss(context.projectId, data.taskIds),
  }));
