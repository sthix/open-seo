import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadReportBacklinks } from "@/server/features/audit/services/reportBacklinks";

const backlinks = vi.hoisted(() => ({
  profileOverview: vi.fn(),
  profileReferringDomainsPage: vi.fn(),
  profileBacklinksPage: vi.fn(),
  profileTopPagesPage: vi.fn(),
}));

vi.mock("@/server/features/backlinks/services/BacklinksService", () => ({
  BacklinksService: backlinks,
}));

const customer = { organizationId: "org", userId: "u", userEmail: "u@x.test" };

describe("loadReportBacklinks", () => {
  beforeEach(() => {
    backlinks.profileOverview.mockResolvedValue({
      overview: {
        displayTarget: "example.com",
        summary: { referringDomains: 12 },
        trends: [],
        fetchedAt: "2026-11-13",
      },
    });
    backlinks.profileReferringDomainsPage.mockRejectedValue(
      new Error("insufficient credits"),
    );
    backlinks.profileBacklinksPage.mockResolvedValue({
      rows: Array.from({ length: 50 }, () => ({ urlFrom: "https://a.test/" })),
    });
    backlinks.profileTopPagesPage.mockResolvedValue({
      rows: [],
    });
  });

  it("bills the project's organization for the whole domain and keeps what loaded", async () => {
    const result = await loadReportBacklinks(
      "https://www.example.com/start",
      customer,
    );

    expect(backlinks.profileOverview).toHaveBeenCalledWith(
      { target: "example.com", scope: "subdomains" },
      customer,
    );
    expect(result.summary.referringDomains).toBe(12);
    expect(result.referringDomains).toEqual([]);
    expect(result.backlinks).toHaveLength(10);
  });
});
