import { sortBy } from "remeda";
import { z } from "zod";
import { BacklinksService } from "@/server/features/backlinks/services/BacklinksService";
import {
  backlinksOverviewSchema,
  backlinksRowSchema,
  backlinksTrendRowSchema,
  referringDomainRowSchema,
  topPageRowSchema,
} from "@/server/features/backlinks/services/backlinksOverviewSchema";
import type { BillingCustomerContext } from "@/server/billing/subscription";
import { getJsonFromR2, putTextToR2 } from "@/server/lib/r2";

/** Rows each list prints; the smallest page the API serves is larger. */
const REPORT_ROWS = 10;
const PAGE_SIZE = 50;
const TREND_POINTS = 6;

/** A list the report can do without: empty when its lookup fails. */
async function rowsOrEmpty<T>(load: () => Promise<{ rows: T[] }>) {
  try {
    return (await load()).rows.slice(0, REPORT_ROWS);
  } catch {
    return [];
  }
}

/** What an audit keeps of the domain's backlinks, for its PDF report. */
const auditBacklinksSchema = z.object({
  target: z.string(),
  summary: backlinksOverviewSchema.shape.summary,
  trends: z.array(backlinksTrendRowSchema),
  referringDomains: z.array(referringDomainRowSchema),
  backlinks: z.array(backlinksRowSchema),
  topPages: z.array(topPageRowSchema),
  fetchedAt: z.string(),
});

type AuditBacklinks = z.infer<typeof auditBacklinksSchema>;

/** Next to the audit's Lighthouse payloads, so deleting the audit removes it. */
function storageKey(projectId: string, auditId: string) {
  return `site-audit/${projectId}/${auditId}/backlinks.json`;
}

/**
 * The site's backlink profile: the same cached lookups the Backlinks page
 * makes (and bills), for the audited domain with its subdomains, so www and
 * non-www links both count.
 */
async function loadBacklinks(
  startUrl: string,
  billingCustomer: BillingCustomerContext,
): Promise<AuditBacklinks> {
  const lookup = {
    target: new URL(startUrl).hostname.replace(/^www\./, ""),
    scope: "subdomains" as const,
  };
  const page = { ...lookup, page: 1, pageSize: PAGE_SIZE, filters: {} };

  const [{ overview }, referringDomains, backlinks, topPages] =
    await Promise.all([
      BacklinksService.profileOverview(lookup, billingCustomer),
      rowsOrEmpty(() =>
        BacklinksService.profileReferringDomainsPage(
          { ...page, sortField: "rank", sortOrder: "desc" },
          billingCustomer,
          { hideSpam: true },
        ),
      ),
      rowsOrEmpty(() =>
        BacklinksService.profileBacklinksPage(
          {
            ...page,
            sortField: "domainRank",
            sortOrder: "desc",
            mode: "one_per_domain",
          },
          billingCustomer,
          { hideSpam: true },
        ),
      ),
      rowsOrEmpty(() =>
        BacklinksService.profileTopPagesPage(
          { ...page, sortField: "backlinks", sortOrder: "desc" },
          billingCustomer,
        ),
      ),
    ]);

  return {
    target: overview.displayTarget,
    summary: overview.summary,
    trends: sortBy(overview.trends, (point) => point.date).slice(-TREND_POINTS),
    referringDomains,
    backlinks,
    topPages,
    fetchedAt: overview.fetchedAt,
  };
}

/**
 * Looks up the backlinks once, while the audit runs, and stores them with
 * the audit. The report reads that copy, so exporting it never calls the API.
 */
export async function storeAuditBacklinks(input: {
  projectId: string;
  auditId: string;
  startUrl: string;
  billingCustomer: BillingCustomerContext;
}) {
  const backlinks = await loadBacklinks(input.startUrl, input.billingCustomer);
  await putTextToR2(
    storageKey(input.projectId, input.auditId),
    JSON.stringify(backlinks),
  );
}

/** The backlinks the audit stored; throws when it stored none. */
export async function readAuditBacklinks(
  projectId: string,
  auditId: string,
): Promise<AuditBacklinks> {
  const text = await getJsonFromR2(storageKey(projectId, auditId));
  return auditBacklinksSchema.parse(JSON.parse(text));
}
