import robotsParser from "robots-parser";
import { AiVisibilityService } from "@/server/features/ai-visibility/services/AiVisibilityService";
import { AuditRepository } from "@/server/features/audit/repositories/AuditRepository";
import { GscService } from "@/server/features/gsc/services/GscService";
import { resolveDateRange } from "@/server/features/gsc/searchAnalytics";
import { toDimensionRows } from "@/server/features/gsc/searchPerformanceReport";
import { fetchSiteTextFile } from "@/server/lib/audit/discovery";
import type { BillingCustomerContext } from "@/server/billing/subscription";
import { loadReportBacklinks } from "@/server/features/audit/services/reportBacklinks";
import { loadStartPageCheck } from "@/server/features/audit/services/startPageCheck";
import { AppError } from "@/server/lib/errors";
import { AI_CRAWLERS } from "@/shared/ai-crawlers";

/** Enough for the pages of any site an audit can crawl. */
const SEARCH_PAGE_ROW_LIMIT = 5000;
const AI_MENTION_DAYS = 28;

function hostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** The audit of the same site that ran before this one, to compare against. */
async function loadPreviousAudit(audit: {
  projectId: string;
  startUrl: string;
  startedAt: string;
}) {
  const host = hostname(audit.startUrl);
  const earlier = await AuditRepository.getEarlierCompletedAudits(
    audit.projectId,
    audit.startedAt,
  );
  const previous = earlier.find(
    (candidate) => hostname(candidate.startUrl) === host,
  );
  if (!previous) return null;

  const [issues, pages] = await Promise.all([
    AuditRepository.getIssuesForAudit(previous.id, {}),
    AuditRepository.getPagesForAudit(previous.id),
  ]);
  return {
    auditedAt: previous.completedAt ?? previous.startedAt,
    pageUrls: pages.map((page) => page.url),
    issues: issues.map((issue) => ({
      issueType: issue.issueType,
      pageUrl: issue.pageUrl,
    })),
  };
}

/** Search Console clicks and impressions per page over the last 28 days. */
async function loadSearchTraffic(projectId: string) {
  const range = resolveDateRange({ dateRange: "last_28_days" });
  const result = await GscService.getPerformance({
    projectId,
    ...range,
    dimensions: ["page"],
    rowLimit: SEARCH_PAGE_ROW_LIMIT,
  });
  return {
    ...range,
    pages: toDimensionRows(result.rows).map((row) => ({
      url: row.key,
      clicks: row.clicks,
      impressions: row.impressions,
    })),
  };
}

/** What the site's robots.txt and llms.txt say to AI crawlers, read now. */
async function loadAiCrawlerAccess(startUrl: string) {
  const origin = new URL(startUrl).origin;
  const [robots, llms] = await Promise.all([
    fetchSiteTextFile(`${origin}/robots.txt`),
    fetchSiteTextFile(`${origin}/llms.txt`),
  ]);

  // A site with no robots.txt allows every crawler.
  const rules = robots
    ? robotsParser(`${origin}/robots.txt`, robots.found ? robots.text : "")
    : null;
  return {
    crawlers: rules
      ? AI_CRAWLERS.map((crawler) => ({
          ...crawler,
          allowed: rules.isAllowed(`${origin}/`, crawler.userAgent) ?? true,
        }))
      : null,
    // Sites that answer every path with their HTML shell have no llms.txt.
    hasLlmsTxt: llms
      ? llms.found && !llms.text.trimStart().startsWith("<")
      : null,
  };
}

/** How often AI answers named or cited the brand, if the project tracks it. */
async function loadAiMentions(projectId: string) {
  const trend = await AiVisibilityService.getTrend({
    projectId,
    days: AI_MENTION_DAYS,
  });
  const answers = trend.current.coverage.answered;
  if (answers === 0 || trend.mentions.current == null) return null;
  return {
    days: AI_MENTION_DAYS,
    answers,
    mentionRate: trend.mentions.current,
    citationRate: trend.citations.current,
  };
}

/** A part the report can do without: null when it is missing or fails. */
async function optional<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch {
    return null;
  }
}

/**
 * What the PDF report shows beyond the audit itself, including a check of
 * the start page read now and the domain's backlinks. Every part is optional:
 * a first audit has nothing to compare with, and a project may have neither
 * Search Console nor prompt tracking.
 */
async function getReportContext(
  auditId: string,
  customer: BillingCustomerContext & { projectId: string },
) {
  const { projectId } = customer;
  const audit = await AuditRepository.getAuditForProject(auditId, projectId);
  if (!audit) throw new AppError("NOT_FOUND");

  const [
    previous,
    searchTraffic,
    aiCrawlerAccess,
    aiMentions,
    startPage,
    backlinks,
  ] = await Promise.all([
    optional(() => loadPreviousAudit(audit)),
    optional(() => loadSearchTraffic(projectId)),
    optional(() => loadAiCrawlerAccess(audit.startUrl)),
    optional(() => loadAiMentions(projectId)),
    optional(() => loadStartPageCheck(audit.startUrl)),
    // Billed like the Backlinks page, and cached for hours, so exporting the
    // report again soon after does not pay for the same lookups twice.
    optional(() => loadReportBacklinks(audit.startUrl, customer)),
  ]);
  return {
    previous,
    searchTraffic,
    aiCrawlerAccess,
    aiMentions,
    startPage,
    backlinks,
  };
}

export const AuditReportService = { getReportContext } as const;
