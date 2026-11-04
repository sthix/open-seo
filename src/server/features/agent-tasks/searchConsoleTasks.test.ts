import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/features/gsc/services/GscService", () => ({
  GscService: {},
}));

import { pickSearchConsolePages } from "./searchConsoleTasks";

const row = (
  page: string,
  impressions: number,
  ctr: number,
  position: number,
) => ({
  page,
  clicks: Math.round(impressions * ctr),
  impressions,
  ctr,
  position,
});

describe("pickSearchConsolePages", () => {
  it("picks page-one pages with weak CTR and pages just below the top, most potential first", () => {
    const picked = pickSearchConsolePages([
      row("https://site.com/low-ctr", 5000, 0.01, 3),
      row("https://site.com/near", 2000, 0.01, 9),
      row("https://site.com/healthy", 5000, 0.12, 2),
      row("https://site.com/few-impressions", 50, 0, 8),
      row("https://site.com/far", 5000, 0, 45),
    ]);

    expect(picked.map((page) => [page.page, page.reason])).toEqual([
      ["https://site.com/low-ctr", "low_ctr"],
      ["https://site.com/near", "near_page_one"],
    ]);
  });
});
