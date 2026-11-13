import { sort } from "remeda";
import { ISSUE_TEXT_DE } from "@/client/features/audit/report/issueTextDe";
import {
  sumTraffic,
  type PageTraffic,
  type TrafficLookup,
} from "@/client/features/audit/report/reportInsights";
import {
  REPORT_STRINGS,
  type ReportLanguage,
} from "@/client/features/audit/report/reportStrings";
import { groupIssues } from "@/client/features/audit/results/IssuesView";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import {
  getIssueDescriptor,
  ISSUE_SEVERITY_ORDER,
} from "@/shared/audit-issues";

const germanIssueText: Partial<
  Record<string, (typeof ISSUE_TEXT_DE)[keyof typeof ISSUE_TEXT_DE]>
> = ISSUE_TEXT_DE;

/** An issue type's title in the report's language. */
export function reportIssueTitle(
  issueType: string,
  language: ReportLanguage,
): string {
  const german = language === "de" ? germanIssueText[issueType] : null;
  return german?.title ?? getIssueDescriptor(issueType)?.title ?? issueType;
}

export type ReportIssueGroup = ReturnType<typeof groupIssues>[number] & {
  /** Search traffic of the affected pages; null without Search Console. */
  traffic: PageTraffic | null;
};

/**
 * The audit's issues by kind, in the report's language and in the order the
 * report recommends: most severe first, then by the search traffic of the
 * affected pages when it is known, then by how many pages are affected.
 */
export function buildReportGroups(
  issues: AuditResultsData["issues"],
  language: ReportLanguage,
  traffic: TrafficLookup | null,
): ReportIssueGroup[] {
  const t = REPORT_STRINGS[language];
  const groups = groupIssues(issues).map((group) => {
    const german = language === "de" ? germanIssueText[group.issueType] : null;
    const howToFix = t.howToFixOverrides[group.issueType];
    // The pages a reader should look at first lead each finding's list.
    const ordered = traffic
      ? sort(
          group.issues,
          (a, b) =>
            traffic(b.pageUrl).impressions - traffic(a.pageUrl).impressions,
        )
      : group.issues;
    return {
      ...group,
      ...german,
      ...(howToFix ? { howToFix } : null),
      issues: ordered,
      traffic: traffic
        ? sumTraffic(
            group.issues.map((issue) => issue.pageUrl),
            traffic,
          )
        : null,
    };
  });
  return sort(
    groups,
    (a, b) =>
      ISSUE_SEVERITY_ORDER[a.severity] - ISSUE_SEVERITY_ORDER[b.severity] ||
      (b.traffic?.impressions ?? 0) - (a.traffic?.impressions ?? 0) ||
      b.issues.length - a.issues.length,
  );
}
