import type {
  getAuditIssues,
  getAuditPages,
  getAuditSummary,
} from "@/serverFunctions/audit";

export type AuditResultsData = Awaited<ReturnType<typeof getAuditSummary>>;
export type AuditPageRow = Awaited<
  ReturnType<typeof getAuditPages>
>["rows"][number];
export type AuditIssueRow = Awaited<ReturnType<typeof getAuditIssues>>[number];
export type AuditLighthouseRow = AuditResultsData["lighthouse"][number];
/** The whole audit for the PDF report: the summary plus every issue and page. */
export type AuditReportData = AuditResultsData & {
  issues: AuditIssueRow[];
  pages: AuditPageRow[];
};
