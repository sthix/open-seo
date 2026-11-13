import type { IssueSeverity } from "@/shared/audit-issues";

export type ReportLanguage = "en" | "de";

/** Every sentence and label the PDF report prints, in one language. */
export interface ReportStrings {
  locale: string;
  kicker: string;
  filePrefix: string;
  auditedOn: string;
  printHint: string;
  printButton: string;
  summary: string;
  summaryLead: (args: {
    host: string;
    date: string;
    pages: number;
    issues: number;
    types: number;
  }) => string;
  noIssuesLead: (args: { host: string; date: string; pages: number }) => string;
  incompleteNote: string;
  pagesCrawled: string;
  issuesFound: string;
  pagesAffected: string;
  avgResponse: string;
  bySeverity: string;
  severity: Record<IssueSeverity, string>;
  severityHint: Record<IssueSeverity, string>;
  statusCodes: string;
  statusNone: string;
  lighthouse: string;
  /** Lighthouse's own bands: 90+ good, 50–89 needs work, below 50 poor. */
  scoreRating: (score: number) => string;
  score: string;
  rating: string;
  category: string;
  startPageScore: string;
  referringDomains: string;
  lighthouseNote: (tests: number, failed: number) => string;
  performance: string;
  accessibility: string;
  seo: string;
  bestPractices: string;
  priorities: string;
  prioritiesIntro: string;
  issue: string;
  pages: string;
  details: string;
  detailsIntro: string;
  whyItMatters: string;
  howToFix: string;
  affectedPages: (count: number) => string;
  andMore: (count: number) => string;
  performanceTitle: string;
  performanceIntro: (shown: number, total: number) => string;
  url: string;
  device: string;
  mobile: string;
  desktop: string;
  failed: string;
  crawledPages: string;
  crawledPagesIntro: (shown: number, total: number) => string;
  status: string;
  title: string;
  words: string;
  response: string;
  about: string;
  aboutText: (args: {
    startUrl: string;
    maxPages: number;
    rendered: boolean;
    lighthouse: boolean;
  }) => string;
  /**
   * Fixes that replace the app's own wording, which names the crawler and
   * this app's settings: a report reader has neither.
   */
  howToFixOverrides: Partial<Record<string, string>>;
  footer: (host: string) => string;
  pageOf: string;
}

const en: ReportStrings = {
  locale: "en-GB",
  kicker: "Site audit",
  filePrefix: "site-audit",
  auditedOn: "Audited on",
  printHint: "Choose “Save as PDF” in the print dialog to keep this report.",
  printButton: "Save as PDF",
  summary: "Summary",
  summaryLead: ({ host, date, pages, issues, types }) =>
    `We crawled ${pages} ${pages === 1 ? "page" : "pages"} of ${host} on ${date} and found ${issues} ${issues === 1 ? "issue" : "issues"} of ${types} ${types === 1 ? "kind" : "different kinds"}. They are listed below in the order we recommend working through them.`,
  noIssuesLead: ({ host, date, pages }) =>
    `We crawled ${pages} ${pages === 1 ? "page" : "pages"} of ${host} on ${date} and found no issues.`,
  incompleteNote:
    "The site refused or rate limited part of the crawl, so this report does not cover every page.",
  pagesCrawled: "Pages crawled",
  issuesFound: "Issues found",
  pagesAffected: "Pages with issues",
  avgResponse: "Average response time",
  bySeverity: "Issues by severity",
  severity: { critical: "Critical", warning: "Warning", info: "Notice" },
  severityHint: {
    critical: "Fix first: these hurt indexing or visitors directly.",
    warning: "Fix next: these hold rankings and click-through back.",
    info: "Worth a look: often intentional, sometimes a quick win.",
  },
  statusCodes: "HTTP status of crawled pages",
  statusNone: "No response",
  lighthouse: "Lighthouse averages",
  scoreRating: (score) =>
    score >= 90 ? "Good" : score >= 50 ? "Needs work" : "Poor",
  score: "Score",
  rating: "Rating",
  category: "Category",
  startPageScore: "Start page check",
  referringDomains: "Websites linking here",
  lighthouseNote: (tests, failed) =>
    `Average of ${tests - failed} Lighthouse ${tests - failed === 1 ? "test" : "tests"} on sampled pages${failed > 0 ? `; ${failed} ${failed === 1 ? "test" : "tests"} failed` : ""}. 90 and above is good, 50 to 89 needs work, below 50 is poor.`,
  performance: "Performance",
  accessibility: "Accessibility",
  seo: "SEO",
  bestPractices: "Best practices",
  priorities: "Priorities",
  prioritiesIntro:
    "Every kind of issue found, most severe first, then by the number of pages affected.",
  issue: "Issue",
  pages: "Pages",
  details: "Findings in detail",
  detailsIntro:
    "What each finding means, how to fix it, and which pages it affects.",
  whyItMatters: "Why it matters",
  howToFix: "How to fix it",
  affectedPages: (count) =>
    `Affected ${count === 1 ? "page" : "pages"} (${count})`,
  andMore: (count) => `and ${count} more`,
  performanceTitle: "Page speed",
  performanceIntro: (shown, total) =>
    shown < total
      ? `The ${shown} slowest of ${total} Lighthouse tests. LCP, INP and TTFB are load-time metrics; CLS measures layout shift.`
      : "Lighthouse results per page, slowest first. LCP, INP and TTFB are load-time metrics; CLS measures layout shift.",
  url: "URL",
  device: "Device",
  mobile: "Mobile",
  desktop: "Desktop",
  failed: "Test failed",
  crawledPages: "Crawled pages",
  crawledPagesIntro: (shown, total) =>
    shown < total
      ? `The first ${shown} of ${total} crawled pages. The full list is available as a CSV export.`
      : "Every page the crawl reached.",
  status: "Status",
  title: "Title",
  words: "Words",
  response: "Response",
  about: "About this report",
  aboutText: ({ startUrl, maxPages, rendered, lighthouse }) =>
    `This report comes from an automated crawl starting at ${startUrl} and limited to ${maxPages} pages. JavaScript rendering was ${rendered ? "on" : "off"}; Lighthouse tests ${lighthouse ? "ran on a sample of pages" : "were not run"}. Automated checks find technical problems reliably, but they cannot judge content quality or search demand. Read the findings as a prioritised technical to-do list.`,
  howToFixOverrides: {
    "blocked-page":
      "Allow our audit crawler in the site's WAF or bot-protection settings (on Cloudflare: a WAF custom rule that skips bot protection for the crawler's user agent), then have the audit re-run. On Shopify, grant crawler access instead (Online Store → Preferences → Crawler access). We will send you the crawler's user agent on request.",
    "rate-limited-page":
      "Raise the rate limit for crawlers, or exempt our audit crawler's user agent from the rate-limiting rules, then have the audit re-run. An audit of fewer pages also helps if the limit is strict. On Shopify, grant crawler access instead (Online Store → Preferences → Crawler access).",
    "crawl-rate-limited":
      "Have the audit re-run after the site's rate limit resets, or exempt our audit crawler from the rate limit. On Shopify, grant crawler access instead (Online Store → Preferences → Crawler access).",
  },
  footer: (host) => `Site audit · ${host}`,
  pageOf: "of",
};

const de: ReportStrings = {
  locale: "de-DE",
  kicker: "Website-Audit",
  filePrefix: "website-audit",
  auditedOn: "Geprüft am",
  printHint:
    "Wählen Sie im Druckdialog „Als PDF speichern“, um den Bericht zu sichern.",
  printButton: "Als PDF speichern",
  summary: "Zusammenfassung",
  summaryLead: ({ host, date, pages, issues, types }) =>
    `Wir haben am ${date} ${pages === 1 ? "eine Seite" : `${pages} Seiten`} von ${host} gecrawlt und dabei ${issues === 1 ? "einen Befund" : `${issues} Befunde`} ${types === 1 ? "einer Art" : `in ${types} verschiedenen Arten`} festgestellt. Sie sind unten in der Reihenfolge aufgeführt, in der wir die Bearbeitung empfehlen.`,
  noIssuesLead: ({ host, date, pages }) =>
    `Wir haben am ${date} ${pages === 1 ? "eine Seite" : `${pages} Seiten`} von ${host} gecrawlt und keine Probleme festgestellt.`,
  incompleteNote:
    "Die Website hat einen Teil des Crawls abgelehnt oder gedrosselt. Dieser Bericht deckt deshalb nicht alle Seiten ab.",
  pagesCrawled: "Gecrawlte Seiten",
  issuesFound: "Befunde",
  pagesAffected: "Betroffene Seiten",
  avgResponse: "Mittlere Antwortzeit",
  bySeverity: "Befunde nach Schweregrad",
  severity: { critical: "Kritisch", warning: "Warnung", info: "Hinweis" },
  severityHint: {
    critical:
      "Zuerst beheben: beeinträchtigt Indexierung oder Besucher direkt.",
    warning: "Danach beheben: bremst Rankings und Klickrate.",
    info: "Prüfen: oft beabsichtigt, manchmal schnell verbessert.",
  },
  statusCodes: "HTTP-Status der gecrawlten Seiten",
  statusNone: "Keine Antwort",
  lighthouse: "Lighthouse-Durchschnitt",
  scoreRating: (score) =>
    score >= 90 ? "Gut" : score >= 50 ? "Verbesserungswürdig" : "Schwach",
  score: "Wert",
  rating: "Bewertung",
  category: "Kategorie",
  startPageScore: "Prüfung der Startseite",
  referringDomains: "Verweisende Websites",
  lighthouseNote: (tests, failed) =>
    `Durchschnitt aus ${tests - failed === 1 ? "einem Lighthouse-Test" : `${tests - failed} Lighthouse-Tests`} auf ausgewählten Seiten${failed > 0 ? `; ${failed === 1 ? "ein Test ist" : `${failed} Tests sind`} fehlgeschlagen` : ""}. Ab 90 gut, 50 bis 89 verbesserungswürdig, unter 50 schwach.`,
  performance: "Performance",
  accessibility: "Barrierefreiheit",
  seo: "SEO",
  bestPractices: "Best Practices",
  priorities: "Prioritäten",
  prioritiesIntro:
    "Alle festgestellten Befundarten, nach Schweregrad und danach nach Zahl der betroffenen Seiten geordnet.",
  issue: "Befund",
  pages: "Seiten",
  details: "Befunde im Detail",
  detailsIntro:
    "Was jeder Befund bedeutet, wie er behoben wird und welche Seiten betroffen sind.",
  whyItMatters: "Warum das wichtig ist",
  howToFix: "So beheben Sie es",
  affectedPages: (count) =>
    `Betroffene ${count === 1 ? "Seite" : "Seiten"} (${count})`,
  andMore: (count) => `und ${count} weitere`,
  performanceTitle: "Ladegeschwindigkeit",
  performanceIntro: (shown, total) =>
    shown < total
      ? `Die ${shown} langsamsten von ${total} Lighthouse-Tests. LCP, INP und TTFB sind Ladezeitwerte; CLS misst Layoutverschiebungen.`
      : "Lighthouse-Ergebnisse je Seite, die langsamsten zuerst. LCP, INP und TTFB sind Ladezeitwerte; CLS misst Layoutverschiebungen.",
  url: "URL",
  device: "Gerät",
  mobile: "Mobil",
  desktop: "Desktop",
  failed: "Test fehlgeschlagen",
  crawledPages: "Gecrawlte Seiten",
  crawledPagesIntro: (shown, total) =>
    shown < total
      ? `Die ersten ${shown} von ${total} gecrawlten Seiten. Die vollständige Liste steht als CSV-Export bereit.`
      : "Alle Seiten, die der Crawl erreicht hat.",
  status: "Status",
  title: "Title",
  words: "Wörter",
  response: "Antwortzeit",
  about: "Über diesen Bericht",
  aboutText: ({ startUrl, maxPages, rendered, lighthouse }) =>
    `Dieser Bericht beruht auf einem automatisierten Crawl, ausgehend von ${startUrl} und begrenzt auf ${maxPages} Seiten. JavaScript-Rendering war ${rendered ? "aktiviert" : "deaktiviert"}; Lighthouse-Tests ${lighthouse ? "liefen auf einer Auswahl von Seiten" : "wurden nicht durchgeführt"}. Automatisierte Prüfungen finden technische Probleme zuverlässig, können aber weder die Qualität der Inhalte noch die Suchnachfrage beurteilen. Verstehen Sie die Befunde als priorisierte technische Aufgabenliste.`,
  // The German issue texts are written for the report already.
  howToFixOverrides: {},
  footer: (host) => `Website-Audit · ${host}`,
  pageOf: "von",
};

export const REPORT_STRINGS: Record<ReportLanguage, ReportStrings> = { en, de };
