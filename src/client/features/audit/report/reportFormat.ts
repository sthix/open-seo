import type { InsightStrings } from "@/client/features/audit/report/reportInsightStrings";
import type { TrafficLookup } from "@/client/features/audit/report/reportInsights";
import type {
  ReportLanguage,
  ReportStrings,
} from "@/client/features/audit/report/reportStrings";

/** What every section needs to print text, numbers, dates and URLs. */
export interface ReportFormat {
  language: ReportLanguage;
  t: ReportStrings;
  /** Text for the progress, search-traffic and AI-search parts. */
  ti: InsightStrings;
  number: (value: number) => string;
  /** A stored timestamp or ISO date as a long date in the report's language. */
  date: (value: string) => string;
  /** A page on the audited host as its path; anything else in full. */
  path: (url: string) => string;
  /** An issue type's title in the report's language. */
  issueTitle: (issueType: string) => string;
  /** Search Console traffic per page, when the project has it connected. */
  traffic: TrafficLookup | null;
}
