import { APIError } from "better-auth/api";
import { hasOrgPermission } from "@/lib/org-permissions";
import { AppError } from "@/server/lib/errors";

// Server functions a read-only viewer may call, by source file and export
// name (TanStack Start embeds both in serverFnMeta at compile time). Everything
// else is denied to viewers, so a new or renamed server function stays closed
// to them until it is listed here. Only list functions that read stored data,
// or that change the viewer's own preferences. The dashboard backlink cards
// are the one paid read: they refresh through a 24-hour per-org cache, so a
// viewer costs no more than the agency opening the same dashboard.
const VIEWER_READABLE: Record<string, readonly string[]> = {
  "src/serverFunctions/ahrefs.ts": ["getAhrefsDomainRatings"],
  "src/serverFunctions/ai-visibility.ts": [
    "getAiResearchSetup",
    "listAiResearchKeywords",
    "getAiVisibilityTracker",
    "getAiVisibilityRun",
    "getAiVisibilityResults",
    "getAiVisibilitySources",
    "getAiVisibilityTrend",
    "getAiVisibilityAnswer",
    "exportAiVisibilityData",
  ],
  "src/serverFunctions/analytics.ts": [
    "getAnalyticsConnections",
    "getAnalyticsReport",
  ],
  "src/serverFunctions/audit.ts": [
    "getAuditStatus",
    "getAuditResults",
    "getAuditHistory",
    "getCrawlProgress",
    "getAuditCapabilities",
  ],
  "src/serverFunctions/billing.ts": ["getBillingAccount"],
  "src/serverFunctions/config.ts": ["getSeoApiKeyStatus"],
  "src/serverFunctions/dashboard.ts": [
    "getDashboardActivation",
    "getDashboardOverview",
    "getDashboardKeywords",
    "getDashboardBacklinks",
    "getDashboardEmergingQueries",
    "getDashboardLinkActivity",
  ],
  "src/serverFunctions/everyApp.ts": ["getEveryAppAccount"],
  "src/serverFunctions/ga4.ts": ["getGa4Connection", "getGa4DashboardReport"],
  "src/serverFunctions/google-maps.ts": ["getLocalMapCopyright"],
  "src/serverFunctions/gsc.ts": ["getGscGrantStatus", "getGscConnection"],
  "src/serverFunctions/keywords.ts": [
    "getSavedKeywords",
    "exportSavedKeywords",
  ],
  "src/serverFunctions/lighthouse.ts": [
    "getAuditLighthouseIssues",
    "exportAuditLighthouseIssues",
  ],
  "src/serverFunctions/local-seo.ts": [
    "listLocalTrackers",
    "getLocalTracker",
    "getLocalScan",
  ],
  // Onboarding answers and the GSC nudge are stored per user.
  "src/serverFunctions/onboarding.ts": [
    "getOnboardingAnswers",
    "getMcpAuthorizedAt",
    "saveOnboardingAnswers",
    "dismissGscNudge",
  ],
  "src/serverFunctions/organization.ts": [
    "getOrganizationContext",
    "getTeam",
    "switchOrganization",
  ],
  "src/serverFunctions/product-updates.ts": ["setProductUpdatesOptIn"],
  "src/serverFunctions/projectContext.ts": ["getProjectContext"],
  "src/serverFunctions/projects.ts": ["getProjects", "getProjectAccess"],
  "src/serverFunctions/rank-tracking.ts": [
    "getRankTrackingConfigs",
    "getRankTrackingConfigSummaries",
    "getLatestRankResults",
    "getLatestRankRun",
    "getRankKeywordHistory",
    "getRankConfigTrend",
    "getRankPositionMatrix",
  ],
  "src/serverFunctions/reports.ts": ["listReports", "getReport"],
  "src/serverFunctions/reportTemplates.ts": ["listReportTemplates"],
  "src/serverFunctions/searchPerformance.ts": [
    "getSearchPerformanceReport",
    "getSearchPerformanceTable",
    "exportSearchPerformanceTable",
  ],
  "src/serverFunctions/terms.ts": ["acceptTermsUpdate"],
  "src/serverFunctions/workspace.ts": ["getWorkspaceMergeStatus"],
};

export function canEditWorkspace(role: string) {
  return hasOrgPermission(role, { workspace: ["edit"] });
}

// Runs in the /api-key/create hook: /mcp refuses viewers anyway, so don't mint
// a key that can never work.
export function refuseReadOnlyApiKey(role: string) {
  if (!canEditWorkspace(role)) {
    throw new APIError("FORBIDDEN", {
      message: "Read-only access does not include MCP.",
    });
  }
}

export function requireServerFunctionAccess(
  role: string,
  serverFn: { name: string; filename: string } | undefined,
) {
  if (canEditWorkspace(role)) return;
  const filename = serverFn?.filename.replaceAll("\\", "/");
  if (
    serverFn &&
    filename &&
    VIEWER_READABLE[filename]?.includes(serverFn.name)
  ) {
    return;
  }
  throw new AppError(
    "FORBIDDEN",
    "You have read-only access to this workspace.",
  );
}
