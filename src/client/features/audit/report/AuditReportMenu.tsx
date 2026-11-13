import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { Button } from "@/client/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { exportAuditReport } from "@/client/features/audit/report/exportAuditReport";
import type { ReportLanguage } from "@/client/features/audit/report/reportStrings";
import type { AuditResultsData } from "@/client/features/audit/results/types";

// Per browser: whether the report includes backlinks, which cost credits.
const BACKLINKS_KEY = "audit-report-backlinks";

function readIncludeBacklinks(): boolean {
  try {
    return localStorage.getItem(BACKLINKS_KEY) !== "0";
  } catch {
    return true;
  }
}

function storeIncludeBacklinks(value: boolean) {
  try {
    localStorage.setItem(BACKLINKS_KEY, value ? "1" : "0");
  } catch {
    // Private browsing or a full quota: the choice lasts for this page only.
  }
}

/**
 * The "PDF report" button: the whole audit as a report, in English or German,
 * with or without the domain's backlinks.
 */
export function AuditReportMenu({
  projectId,
  data,
}: {
  projectId: string;
  data: AuditResultsData;
}) {
  const [includeBacklinks, setIncludeBacklinks] =
    useState(readIncludeBacklinks);
  const exportIn = (language: ReportLanguage) =>
    void exportAuditReport({ projectId, data, language, includeBacklinks });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <FileText data-icon="inline-start" />
        PDF report
        <ChevronDown data-icon="inline-end" className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Contents</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={includeBacklinks}
            onCheckedChange={(checked) => {
              setIncludeBacklinks(checked);
              storeIncludeBacklinks(checked);
            }}
          >
            Include backlinks
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Report language</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => exportIn("en")}>
            English
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportIn("de")}>
            Deutsch
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
