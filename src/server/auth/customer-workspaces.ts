import { getAuth } from "@/lib/auth";
import { getAuthMode } from "@/lib/auth-mode";
import { requireOrgPermission } from "@/server/auth/org-gate";
import { AppError } from "@/server/lib/errors";
import type { EnsuredUserContext } from "@/middleware/ensure-user/types";

// Better Auth's public create-organization endpoint remains disabled. This
// system action is deliberately limited to owners of self-hosted workspaces.
export async function createCustomerWorkspace(
  authMode: string | undefined,
  context: Pick<EnsuredUserContext, "userId" | "role">,
  name: string,
) {
  if (getAuthMode(authMode) !== "password") throw new AppError("NOT_FOUND");
  requireOrgPermission(context, { billing: ["manage"] });

  const organization = await getAuth().api.createOrganization({
    body: {
      name,
      slug: `customer-${crypto.randomUUID()}`,
      userId: context.userId,
    },
  });
  return { organizationId: organization.id };
}
