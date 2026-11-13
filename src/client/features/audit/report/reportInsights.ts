import { sortBy } from "remeda";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import type { getAuditReportContext } from "@/serverFunctions/audit";

export type AuditReportContext = Awaited<
  ReturnType<typeof getAuditReportContext>
>;

export interface PageTraffic {
  clicks: number;
  impressions: number;
}
export type TrafficLookup = (url: string) => PageTraffic;

/**
 * One key per page however it is written: Search Console and the crawler
 * differ on protocol, "www." and the trailing slash.
 */
function urlKey(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}${parsed.search}`;
  } catch {
    return url;
  }
}

const NO_TRAFFIC: PageTraffic = { clicks: 0, impressions: 0 };

export function buildTrafficLookup(
  searchTraffic: NonNullable<AuditReportContext["searchTraffic"]>,
): TrafficLookup {
  const byPage = new Map<string, PageTraffic>();
  for (const page of searchTraffic.pages) {
    const key = urlKey(page.url);
    const known = byPage.get(key) ?? NO_TRAFFIC;
    byPage.set(key, {
      clicks: known.clicks + page.clicks,
      impressions: known.impressions + page.impressions,
    });
  }
  return (url) => byPage.get(urlKey(url)) ?? NO_TRAFFIC;
}

/** Traffic of a set of pages, each counted once. */
export function sumTraffic(
  urls: string[],
  traffic: TrafficLookup,
): PageTraffic {
  let clicks = 0;
  let impressions = 0;
  for (const url of new Set(urls)) {
    const page = traffic(url);
    clicks += page.clicks;
    impressions += page.impressions;
  }
  return { clicks, impressions };
}

interface TypeProgress {
  issueType: string;
  fixed: number;
  added: number;
  open: number;
}

/**
 * What changed since the previous audit. An issue only counts as fixed when
 * its page was crawled again, and only as new when its page was crawled
 * before: the two crawls rarely cover exactly the same pages.
 */
export function compareWithPrevious(
  data: AuditResultsData,
  previous: NonNullable<AuditReportContext["previous"]>,
) {
  const issueKey = (issue: { issueType: string; pageUrl: string }) =>
    `${issue.issueType}\n${urlKey(issue.pageUrl)}`;
  const nowIssues = new Set(data.issues.map(issueKey));
  const thenIssues = new Set(previous.issues.map(issueKey));
  const nowPages = new Set(data.pages.map((page) => urlKey(page.url)));
  const thenPages = new Set(previous.pageUrls.map(urlKey));

  const byType = new Map<string, TypeProgress>();
  const row = (issueType: string) => {
    let entry = byType.get(issueType);
    if (!entry) {
      entry = { issueType, fixed: 0, added: 0, open: 0 };
      byType.set(issueType, entry);
    }
    return entry;
  };

  const totals = {
    fixed: 0,
    added: 0,
    open: 0,
    notRechecked: 0,
    onNewPages: 0,
  };
  for (const issue of previous.issues) {
    if (nowIssues.has(issueKey(issue))) continue;
    if (!nowPages.has(urlKey(issue.pageUrl))) {
      totals.notRechecked += 1;
      continue;
    }
    totals.fixed += 1;
    row(issue.issueType).fixed += 1;
  }
  for (const issue of data.issues) {
    if (thenIssues.has(issueKey(issue))) {
      totals.open += 1;
      row(issue.issueType).open += 1;
    } else if (thenPages.has(urlKey(issue.pageUrl))) {
      totals.added += 1;
      row(issue.issueType).added += 1;
    } else {
      totals.onNewPages += 1;
    }
  }

  return {
    ...totals,
    previousIssueCount: previous.issues.length,
    byType: sortBy(
      [...byType.values()].filter(
        (entry) => entry.fixed > 0 || entry.added > 0,
      ),
      [(entry) => entry.fixed + entry.added, "desc"],
    ),
  };
}
