import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOrgPermission } from "@/server/auth/org-gate";
import {
  analyticsConnectionInput,
  analyticsProvider,
} from "@/server/features/analytics/analytics-provider";
import {
  deleteAnalytics,
  listAnalytics,
  reportAnalytics,
  saveAnalytics,
} from "@/server/features/analytics/analytics-service";
import { requireProjectContext } from "@/serverFunctions/middleware";

const project = z.object({ projectId: z.string().min(1) });
const scopedProvider = project.extend({ provider: analyticsProvider });

export const getAnalyticsConnections = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(project)
  .handler(({ context }) =>
    listAnalytics(context.projectId, context.organizationId),
  );
export const saveAnalyticsConnection = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(project.extend({ connection: analyticsConnectionInput }))
  .handler(async ({ context, data }) => {
    requireOrgPermission(context, { integration: ["manage"] });
    await saveAnalytics(
      context.projectId,
      context.organizationId,
      data.connection,
    );
    return { saved: true };
  });
export const deleteAnalyticsConnection = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(scopedProvider)
  .handler(async ({ context, data }) => {
    requireOrgPermission(context, { integration: ["manage"] });
    await deleteAnalytics(
      context.projectId,
      context.organizationId,
      data.provider,
    );
    return { deleted: true };
  });
export const getAnalyticsReport = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .validator(scopedProvider)
  .handler(({ context, data }) =>
    reportAnalytics(context.projectId, context.organizationId, data.provider),
  );
