import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  attachmentInputSchema,
  MAX_ATTACHMENTS,
} from "@/shared/agent-task-attachments";
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

export const createAgentTask = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(
    project.extend({
      title: z.string().trim().min(1).max(200),
      brief: z.string().trim().min(1).max(20_000),
      targetUrl: z.string().trim().url().max(500).nullable(),
      queue: z.boolean(),
      attachments: z.array(attachmentInputSchema).max(MAX_ATTACHMENTS),
    }),
  )
  .handler(({ context, data }) =>
    AgentTaskService.create({
      projectId: context.projectId,
      organizationId: context.organizationId,
      userId: context.userId,
      title: data.title,
      brief: data.brief,
      targetUrl: data.targetUrl,
      queue: data.queue,
      attachments: data.attachments,
    }),
  );

export const getAgentTaskAttachment = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(
    project.extend({
      taskId: z.string().min(1),
      attachmentId: z.string().min(1),
    }),
  )
  .handler(({ context, data }) =>
    AgentTaskService.readAttachment(
      context.projectId,
      data.taskId,
      data.attachmentId,
    ),
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
