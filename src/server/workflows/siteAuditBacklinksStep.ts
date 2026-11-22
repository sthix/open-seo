import type { WorkflowStep } from "cloudflare:workers";
import type { BillingCustomerContext } from "@/server/billing/subscription";
import { storeAuditBacklinks } from "@/server/features/audit/services/auditBacklinks";
import type { AuditConfig } from "@/server/lib/audit/types";
import { BACKLINKS_STEP } from "@/server/workflows/auditStepConfigs";
import { pgStep } from "@/server/workflows/pgStep";

/**
 * The domain's backlinks for the report, when the audit was started with
 * them. A failed lookup (no credits, an API error) leaves the report without
 * backlinks instead of failing the audit.
 */
export async function runBacklinksStep(
  step: WorkflowStep,
  params: {
    auditId: string;
    projectId: string;
    startUrl: string;
    billingCustomer: BillingCustomerContext;
    config: AuditConfig;
  },
) {
  if (!params.config.includeBacklinks) return;
  const { auditId, projectId, startUrl, billingCustomer } = params;
  try {
    await pgStep(step, "store-backlinks", BACKLINKS_STEP, () =>
      storeAuditBacklinks({ auditId, projectId, startUrl, billingCustomer }),
    );
  } catch (error) {
    console.warn(`Audit ${auditId}: backlinks not stored`, error);
  }
}
