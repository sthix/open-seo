import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditReportService } from "@/server/features/audit/services/AuditReportService";

const mocks = vi.hoisted(() => ({
  getAuditForProject: vi.fn(),
  getEarlierCompletedAudits: vi.fn(),
  loadReportBacklinks: vi.fn(),
}));

vi.mock("cloudflare:workers", () => ({ env: {} }));
vi.mock("@/server/features/audit/repositories/AuditRepository", () => ({
  AuditRepository: {
    getAuditForProject: mocks.getAuditForProject,
    getEarlierCompletedAudits: mocks.getEarlierCompletedAudits,
  },
}));
vi.mock("@/server/features/audit/services/reportBacklinks", () => ({
  loadReportBacklinks: mocks.loadReportBacklinks,
}));
vi.mock("@/server/features/audit/services/startPageCheck", () => ({
  loadStartPageCheck: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/server/lib/audit/discovery", () => ({
  fetchSiteTextFile: vi.fn().mockResolvedValue(null),
}));

const customer = {
  organizationId: "org",
  userId: "u",
  userEmail: "u@x.test",
  projectId: "project",
};

describe("AuditReportService.getReportContext", () => {
  beforeEach(() => {
    mocks.getAuditForProject.mockResolvedValue({
      projectId: "project",
      startUrl: "https://example.com/",
      startedAt: "2026-11-13T10:00:00Z",
    });
    mocks.getEarlierCompletedAudits.mockResolvedValue([]);
    mocks.loadReportBacklinks.mockResolvedValue({ target: "example.com" });
  });

  it("loads backlinks only when the report includes them", async () => {
    const without = await AuditReportService.getReportContext(
      "audit",
      customer,
      { includeBacklinks: false },
    );
    expect(without.backlinks).toBeNull();
    expect(mocks.loadReportBacklinks).not.toHaveBeenCalled();

    const withLinks = await AuditReportService.getReportContext(
      "audit",
      customer,
      { includeBacklinks: true },
    );
    expect(withLinks.backlinks).toEqual({ target: "example.com" });
    expect(mocks.loadReportBacklinks).toHaveBeenCalledWith(
      "https://example.com/",
      customer,
    );
  });
});
