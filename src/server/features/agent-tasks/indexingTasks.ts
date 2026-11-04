import { sortBy } from "remeda";
import { AuditRepository } from "@/server/features/audit/repositories/AuditRepository";
import { GscService } from "@/server/features/gsc/services/GscService";
import type { ProposedAgentTask } from "./AgentTaskRepository";

// Google answers each inspection in about 6 seconds and allows 2,000 a day
// per property, so one run checks only the likeliest suspects.
const MAX_INSPECTIONS = 20;

/**
 * Sitemap pages that Google hasn't indexed. Suspects are indexable pages
 * from the latest audit's sitemap that got no impressions in 28 days; URL
 * Inspection confirms which of them aren't indexed and why. One task lists
 * them all, since the causes (noindex, canonicals, missing internal links)
 * usually share a fix.
 */
export async function findIndexingTasks(
  projectId: string,
): Promise<ProposedAgentTask[]> {
  const audit = await AuditRepository.getLatestAuditForProject(projectId);
  if (!audit || audit.status !== "completed") return [];
  const pages = (await AuditRepository.getPagesForAudit(audit.id)).filter(
    (page) => page.inSitemap && page.isIndexable && page.statusCode === 200,
  );
  if (!pages.length) return [];
  const performance = await GscService.getPerformance({
    projectId,
    dimensions: ["page"],
    dateRange: "last_28_days",
    rowLimit: 25000,
  });
  const seen = new Set(performance.rows.map((row) => row.keys?.[0]));
  const suspects = sortBy(
    pages.filter((page) => !seen.has(page.url)),
    (page) => page.crawlDepth ?? 99,
  )
    .slice(0, MAX_INSPECTIONS)
    .map((page) => page.url);
  if (!suspects.length) return [];
  const inspected = await GscService.inspectUrls({ projectId, urls: suspects });
  const notIndexed = inspected.results.filter(
    (item) =>
      item.result?.indexStatusResult?.verdict &&
      item.result.indexStatusResult.verdict !== "PASS",
  );
  if (!notIndexed.length) return [];
  const list = notIndexed
    .map((item) => {
      const status = item.result?.indexStatusResult;
      const parts = [
        status?.coverageState,
        status?.robotsTxtState && status.robotsTxtState !== "ALLOWED"
          ? `robots.txt: ${status.robotsTxtState}`
          : null,
        status?.googleCanonical &&
        status.userCanonical &&
        status.googleCanonical !== status.userCanonical
          ? `Google picked ${status.googleCanonical} as canonical instead of ${status.userCanonical}`
          : null,
        status?.lastCrawlTime
          ? `last crawled ${status.lastCrawlTime}`
          : "never crawled",
      ].filter(Boolean);
      return `- ${item.url}: ${parts.join("; ")}`;
    })
    .join("\n");
  return [
    {
      type: "indexing",
      dedupeKey: `indexing:${audit.id}`,
      title: `Get ${notIndexed.length} sitemap ${notIndexed.length === 1 ? "page" : "pages"} indexed`,
      brief: `## Get sitemap pages indexed

Google's URL Inspection says these pages from the sitemap aren't indexed:

${list}

### What to do
For each page, look in this repository for what keeps it out of Google:
- a \`noindex\` meta tag or header, or a robots.txt rule
- a canonical tag pointing at another URL, or hreflang pairs that disagree
- no internal links to it (add one or two from related pages or an overview page)
- content that duplicates another page (say so instead of rewriting it)

"Discovered – currently not indexed" and "Crawled – currently not indexed" usually mean Google sees little value or few links: internal links help most there. Fix only causes you can confirm in the code, and explain each page in your final message. Indexing requests are sent separately; don't add tooling for them.`,
      targetUrl: null,
      score: notIndexed.length * 30,
    },
  ];
}
