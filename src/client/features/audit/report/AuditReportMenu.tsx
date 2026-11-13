import { ChevronDown, FileText } from "lucide-react";
import { Button } from "@/client/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { exportAuditReport } from "@/client/features/audit/report/exportAuditReport";
import type { AuditResultsData } from "@/client/features/audit/results/types";

/** The "PDF report" button: the whole audit as a report, in English or German. */
export function AuditReportMenu({ data }: { data: AuditResultsData }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <FileText data-icon="inline-start" />
        PDF report
        <ChevronDown data-icon="inline-end" className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Report language</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => void exportAuditReport(data, "en")}>
            English
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void exportAuditReport(data, "de")}>
            Deutsch
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
