import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditReportService } from "@/server/features/audit/services/AuditReportService";

const mocks = vi.hoisted(() => ({
  getAuditForProject: vi.fn(),
  getEarlierCompletedAudits: vi.fn(),
  readAuditBacklinks: vi.fn(),
  storeAuditBacklinks: vi.fn(),
}));

vi.mock("cloudflare:workers", () => ({ env: {} }));
vi.mock("@/server/features/audit/repositories/AuditRepository", () => ({
  AuditRepository: {
    getAuditForProject: mocks.getAuditForProject,
    getEarlierCompletedAudits: mocks.getEarlierCompletedAudits,
  },
}));
vi.mock("@/server/features/audit/services/auditBacklinks", () => ({
  readAuditBacklinks: mocks.readAuditBacklinks,
  storeAuditBacklinks: mocks.storeAuditBacklinks,
}));
vi.mock("@/server/features/audit/services/startPageCheck", () => ({
  loadStartPageCheck: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/server/lib/audit/discovery", () => ({
  fetchSiteTextFile: vi.fn().mockResolvedValue(null),
}));

describe("AuditReportService.getReportContext", () => {
  beforeEach(() => {
    mocks.getAuditForProject.mockResolvedValue({
      projectId: "project",
      startUrl: "https://example.com/",
      startedAt: "2026-11-13T10:00:00Z",
    });
    mocks.getEarlierCompletedAudits.mockResolvedValue([]);
    mocks.readAuditBacklinks.mockResolvedValue({ target: "example.com" });
  });

  it("shows the backlinks the audit stored without calling the API", async () => {
    const context = await AuditReportService.getReportContext(
      "audit",
      "project",
    );
    expect(context.backlinks).toEqual({ target: "example.com" });
    expect(mocks.readAuditBacklinks).toHaveBeenCalledWith("project", "audit");
    expect(mocks.storeAuditBacklinks).not.toHaveBeenCalled();
  });

  it("prints without backlinks when the audit stored none", async () => {
    mocks.readAuditBacklinks.mockRejectedValue(new Error("not found"));
    const context = await AuditReportService.getReportContext(
      "audit",
      "project",
    );
    expect(context.backlinks).toBeNull();
  });
});
