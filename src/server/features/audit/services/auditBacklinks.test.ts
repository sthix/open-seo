import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  readAuditBacklinks,
  storeAuditBacklinks,
} from "@/server/features/audit/services/auditBacklinks";

const mocks = vi.hoisted(() => ({
  profileOverview: vi.fn(),
  profileReferringDomainsPage: vi.fn(),
  profileBacklinksPage: vi.fn(),
  profileTopPagesPage: vi.fn(),
  objects: new Map<string, string>(),
}));

vi.mock("@/server/features/backlinks/services/BacklinksService", () => ({
  BacklinksService: {
    profileOverview: mocks.profileOverview,
    profileReferringDomainsPage: mocks.profileReferringDomainsPage,
    profileBacklinksPage: mocks.profileBacklinksPage,
    profileTopPagesPage: mocks.profileTopPagesPage,
  },
}));
vi.mock("@/server/lib/r2", () => ({
  putTextToR2: (key: string, body: string) => {
    mocks.objects.set(key, body);
    return Promise.resolve({ key, sizeBytes: body.length });
  },
  getJsonFromR2: (key: string) => {
    const body = mocks.objects.get(key);
    return body ? Promise.resolve(body) : Promise.reject(new Error("missing"));
  },
}));

const customer = { organizationId: "org", userId: "u", userEmail: "u@x.test" };
const summary = {
  rank: 200,
  backlinks: 50,
  referringPages: 40,
  referringDomains: 12,
  brokenBacklinks: 0,
  brokenPages: 0,
  backlinksSpamScore: 3,
  targetSpamScore: 1,
  newBacklinks: null,
  lostBacklinks: null,
  newReferringDomains: null,
  lostReferringDomains: null,
};
const link = {
  domainFrom: "a.test",
  urlFrom: "https://a.test/",
  urlTo: "https://example.com/",
  anchor: "Example",
  itemType: "anchor",
  isDofollow: true,
  relAttributes: [],
  rank: 10,
  domainFromRank: 100,
  pageFromRank: 10,
  spamScore: 0,
  firstSeen: null,
  lastSeen: null,
  isLost: false,
  isBroken: false,
  linksCount: 1,
};

describe("audit backlinks", () => {
  beforeEach(() => {
    mocks.objects.clear();
    mocks.profileOverview.mockResolvedValue({
      overview: {
        displayTarget: "example.com",
        summary,
        trends: [],
        fetchedAt: "2026-11-13",
      },
    });
    mocks.profileReferringDomainsPage.mockRejectedValue(
      new Error("insufficient credits"),
    );
    mocks.profileBacklinksPage.mockResolvedValue({
      rows: Array.from({ length: 50 }, () => link),
    });
    mocks.profileTopPagesPage.mockResolvedValue({ rows: [] });
  });

  it("bills the organization for the whole domain and keeps what loaded", async () => {
    await storeAuditBacklinks({
      projectId: "project",
      auditId: "audit",
      startUrl: "https://www.example.com/start",
      billingCustomer: customer,
    });

    expect(mocks.profileOverview).toHaveBeenCalledWith(
      { target: "example.com", scope: "subdomains" },
      customer,
    );
    const stored = await readAuditBacklinks("project", "audit");
    expect(stored.summary.referringDomains).toBe(12);
    expect(stored.referringDomains).toEqual([]);
    expect(stored.backlinks).toHaveLength(10);
  });
});
