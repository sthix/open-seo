import { sortBy } from "remeda";
import { GscService } from "@/server/features/gsc/services/GscService";
import type { ProposedAgentTask } from "./AgentTaskRepository";

// Rough organic click-through rate by average position, used only to rank
// pages by the clicks a better title or snippet could win. Real CTR varies
// by query and SERP features; these are deliberately conservative.
const EXPECTED_CTR = [
  0.28, 0.15, 0.1, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.018,
];
const expectedCtr = (position: number) =>
  EXPECTED_CTR[Math.max(1, Math.round(position)) - 1] ?? 0.01;

const MIN_IMPRESSIONS = 100;
const MAX_TASKS = 10;

type PageRow = {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

/**
 * Pages worth a better title, meta description or intro: on page one with a
 * click-through rate well below what their position usually gets, or close
 * to page one (positions 4–20) with enough impressions to matter. Scored by
 * the extra clicks per 28 days they could plausibly win.
 */
export function pickSearchConsolePages(rows: PageRow[]) {
  const candidates = rows
    .filter((row) => row.impressions >= MIN_IMPRESSIONS)
    .map((row) => {
      const lowCtr =
        row.position <= 10 && row.ctr < expectedCtr(row.position) * 0.5;
      const nearPageOne = row.position >= 4 && row.position <= 20;
      // What the page would get one to three places higher, or at its
      // current place with a typical CTR.
      const target = nearPageOne
        ? expectedCtr(Math.max(1, row.position - 3))
        : expectedCtr(row.position);
      const potential = Math.max(0, row.impressions * (target - row.ctr));
      return {
        ...row,
        reason: lowCtr ? ("low_ctr" as const) : ("near_page_one" as const),
        score: Math.round(potential),
        qualifies: lowCtr || nearPageOne,
      };
    })
    .filter((row) => row.qualifies && row.score > 0);
  return sortBy(candidates, [(row) => row.score, "desc"]).slice(0, MAX_TASKS);
}

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

function briefFor(
  page: ReturnType<typeof pickSearchConsolePages>[number],
  queries: PageRow[],
) {
  const why =
    page.reason === "low_ctr"
      ? `It ranks on page one (average position ${page.position.toFixed(1)}), but only ${pct(page.ctr)} of searchers click it; pages at this position usually get about ${pct(expectedCtr(page.position))}.`
      : `It ranks just below the top results (average position ${page.position.toFixed(1)}) with ${page.impressions} impressions in 28 days, so a page that matches these searches better can climb and win clicks.`;
  const table = queries
    .map(
      (query) =>
        `| ${query.page} | ${query.clicks} | ${query.impressions} | ${pct(query.ctr)} | ${query.position.toFixed(1)} |`,
    )
    .join("\n");
  return `## Improve the search snippet and intro of ${page.page}

${why}

Search Console, last 28 days: ${page.clicks} clicks, ${page.impressions} impressions, CTR ${pct(page.ctr)}, average position ${page.position.toFixed(1)}.

Top searches this page shows up for:

| Query | Clicks | Impressions | CTR | Position |
| --- | --- | --- | --- | --- |
${table || "| (no query data) | | | | |"}

### What to do
1. Find the file that renders ${page.page} in this repository (page, content entry or data file) and read the page.
2. Rewrite the title (at most 60 characters) and meta description (at most 155 characters) so they answer the searches above in the page's own language and make the click worth it. Put the main search term near the start of the title.
3. If the first paragraph doesn't answer the main search directly, rewrite it to do so in two or three sentences.
4. Keep every fact the page already states; don't invent numbers, prices, guarantees, testimonials or claims about competitors.
5. Don't change the URL, slug, canonical or other pages.

In your final message, list the old and new title and description.`;
}

/** Search Console tasks for one project; an unconnected project has none. */
export async function findSearchConsoleTasks(
  projectId: string,
): Promise<ProposedAgentTask[]> {
  const result = await GscService.getPerformance({
    projectId,
    dimensions: ["page"],
    dateRange: "last_28_days",
    rowLimit: 1000,
  });
  const pages = pickSearchConsolePages(
    result.rows.map((row) => ({
      page: row.keys?.[0] ?? "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })),
  );
  return Promise.all(
    pages.map(async (page) => {
      const queries = await GscService.getPerformance({
        projectId,
        dimensions: ["query"],
        dateRange: "last_28_days",
        filters: [
          { dimension: "page", operator: "equals", expression: page.page },
        ],
        rowLimit: 10,
      });
      return {
        type: "search_console" as const,
        dedupeKey: `search_console:${page.page}`,
        title: `Improve title and description of ${new URL(page.page).pathname}`,
        brief: briefFor(
          page,
          queries.rows.map((row) => ({
            page: row.keys?.[0] ?? "",
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          })),
        ),
        targetUrl: page.page,
        score: page.score,
      };
    }),
  );
}
