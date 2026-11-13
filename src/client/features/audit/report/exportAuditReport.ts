import { toast } from "sonner";
import interLatinExt from "@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2?url";
import interLatin from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import type { ReportLanguage } from "@/client/features/audit/report/reportStrings";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import { captureClientEvent } from "@/client/lib/posthog";
import { getAuditReportContext } from "@/serverFunctions/audit";

/**
 * Opens the audit as a print-ready report in a new tab, which then opens the
 * browser's print dialog for "Save as PDF", like a report's own PDF export.
 */
export async function exportAuditReport(args: {
  projectId: string;
  data: AuditResultsData;
  language: ReportLanguage;
}) {
  const { projectId, data, language } = args;
  // Opened inside the click, before any await, or the popup blocker stops it.
  const tab = window.open("", "_blank");
  if (!tab) {
    toast.error("Allow pop-ups for this site to open the PDF report");
    return;
  }

  try {
    // The report and its German texts load only when someone exports one.
    const [{ renderAuditReportHtml }, context] = await Promise.all([
      import("@/client/features/audit/report/AuditReportDocument"),
      // Without it the report still prints, just without the comparison,
      // search traffic and AI crawler access.
      getAuditReportContext({
        data: { projectId, auditId: data.audit.id },
      }).catch(() => null),
    ]);
    const html = renderAuditReportHtml({
      data,
      context,
      language,
      fonts: {
        latin: new URL(interLatin, window.location.origin).href,
        latinExt: new URL(interLatinExt, window.location.origin).href,
      },
    });
    // Never revoked: the tab must survive a reload while the user reads it.
    tab.location.replace(
      URL.createObjectURL(new Blob([html], { type: "text/html" })),
    );
  } catch {
    tab.close();
    toast.error("Could not create the PDF report");
    return;
  }

  captureClientEvent("data:export", {
    source_feature: "audit_report",
    format: "pdf",
    language,
    result_count: data.issues.length,
  });
}
