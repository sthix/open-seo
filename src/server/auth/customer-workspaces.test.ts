import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCustomerWorkspace } from "./customer-workspaces";

const mocks = vi.hoisted(() => ({
  create:
    vi.fn<
      (input: {
        body: { name: string; slug: string; userId: string };
      }) => Promise<{ id: string }>
    >(),
}));
vi.mock("@/lib/auth", () => ({
  getAuth: () => ({ api: { createOrganization: mocks.create } }),
}));

describe("customer workspace creation", () => {
  beforeEach(() => {
    mocks.create.mockResolvedValue({ id: "new-workspace" });
  });

  it("creates an isolated organization owned by the authenticated owner", async () => {
    const result = await createCustomerWorkspace(
      "password",
      { userId: "agency", role: "owner" },
      "Customer",
    );
    expect(result).toEqual({ organizationId: "new-workspace" });
    const body = mocks.create.mock.calls[0]?.[0].body;
    expect(body).toMatchObject({ name: "Customer", userId: "agency" });
    expect(body?.slug).toMatch(/^customer-/);
  });

  it("does not let an invited admin create workspaces", async () => {
    await expect(
      createCustomerWorkspace(
        "password",
        { userId: "customer", role: "admin" },
        "Other",
      ),
    ).rejects.toThrow();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("does not create workspaces in hosted mode", async () => {
    await expect(
      createCustomerWorkspace(
        "hosted",
        { userId: "agency", role: "owner" },
        "Other",
      ),
    ).rejects.toThrow();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
