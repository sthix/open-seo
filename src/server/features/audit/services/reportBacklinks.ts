import { sortBy } from "remeda";
import { BacklinksService } from "@/server/features/backlinks/services/BacklinksService";
import type { BillingCustomerContext } from "@/server/billing/subscription";

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

/**
 * The site's backlink profile for the report: the same cached lookups the
 * Backlinks page makes (and bills), for the audited domain with its
 * subdomains, so www and non-www links both count.
 */
export async function loadReportBacklinks(
  startUrl: string,
  billingCustomer: BillingCustomerContext,
) {
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
