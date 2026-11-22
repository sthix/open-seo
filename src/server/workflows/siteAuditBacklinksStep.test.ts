import { beforeEach, describe, expect, it, vi } from "vitest";
import { runBacklinksStep } from "@/server/workflows/siteAuditBacklinksStep";

const mocks = vi.hoisted(() => ({ storeAuditBacklinks: vi.fn() }));

vi.mock("cloudflare:workers", () => ({ env: {} }));
vi.mock("@/server/features/audit/services/auditBacklinks", () => ({
  storeAuditBacklinks: mocks.storeAuditBacklinks,
}));
vi.mock("@/server/workflows/pgStep", () => ({
  pgStep: (
    _step: unknown,
    _name: string,
    _config: unknown,
    callback: () => Promise<unknown>,
  ) => callback(),
}));

const billingCustomer = {
  organizationId: "org",
  userId: "u",
  userEmail: "u@x.test",
};
const params = (includeBacklinks: boolean) => ({
  auditId: "audit",
  projectId: "project",
  startUrl: "https://example.com/",
  billingCustomer,
  config: {
    maxPages: 50,
    lighthouseStrategy: "none" as const,
    includeBacklinks,
  },
});

describe("runBacklinksStep", () => {
  beforeEach(() => {
    mocks.storeAuditBacklinks.mockResolvedValue(undefined);
  });

  it("calls the paid lookup only when the audit asks for it", async () => {
    // pgStep is mocked, so no WorkflowStep implementation is needed.
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    await runBacklinksStep({} as never, params(false));
    expect(mocks.storeAuditBacklinks).not.toHaveBeenCalled();

    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    await runBacklinksStep({} as never, params(true));
    expect(mocks.storeAuditBacklinks).toHaveBeenCalledWith({
      auditId: "audit",
      projectId: "project",
      startUrl: "https://example.com/",
      billingCustomer,
    });
  });

  it("does not fail the audit when the lookup fails", async () => {
    mocks.storeAuditBacklinks.mockRejectedValue(new Error("no credits"));
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    await expect(runBacklinksStep({} as never, params(true))).resolves.toBe(
      undefined,
    );
  });
});
