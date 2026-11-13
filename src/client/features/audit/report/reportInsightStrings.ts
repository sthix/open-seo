import type { ReportLanguage } from "@/client/features/audit/report/reportStrings";
import type { AiCrawlerPurpose } from "@/shared/ai-crawlers";

/** Text for the progress, search-traffic and AI-search parts of the report. */
export interface InsightStrings {
  progress: string;
  progressIntro: (date: string) => string;
  fixed: string;
  added: string;
  stillOpen: string;
  issuesThen: string;
  issuesNow: string;
  noChange: string;
  coverageNote: (notRechecked: number, onNewPages: number) => string;
  changesByIssue: string;

  prioritiesIntro: string;
  clicks: string;
  impressions: string;
  impressionsShort: string;
  trafficNote: (start: string, end: string) => string;
  topPages: string;
  topPagesIntro: string;
  page: string;
  issues: string;

  ai: string;
  aiIntro: string;
  crawlerAccess: string;
  crawlerAccessValue: (allowed: number, total: number) => string;
  crawlerAccessText: string;
  crawlerAccessUnknown: string;
  crawler: string;
  operator: string;
  usedFor: string;
  purpose: Record<AiCrawlerPurpose, string>;
  allowed: string;
  blocked: string;
  unknown: string;
  noJavaScript: string;
  noJavaScriptText: string;
  structuredData: string;
  structuredDataText: string;
  /** `count` and `total` arrive formatted; `totalCount` picks the plural. */
  pagesOf: (count: string, total: string, totalCount: number) => string;
  llmsTxt: string;
  llmsTxtText: string;
  present: string;
  absent: string;
  aiMentions: string;
  aiMentionsText: (args: {
    mentionRate: string;
    citationRate: string | null;
    answers: number;
    days: number;
  }) => string;
}

const en: InsightStrings = {
  progress: "Progress since the last audit",
  progressIntro: (date) => `What changed compared with the audit of ${date}.`,
  fixed: "Fixed",
  added: "New",
  stillOpen: "Still open",
  issuesThen: "Issues then",
  issuesNow: "Issues now",
  noChange: "The same issues were found on the same pages as last time.",
  coverageNote: (notRechecked, onNewPages) =>
    [
      notRechecked > 0
        ? `${notRechecked} earlier ${notRechecked === 1 ? "issue is" : "issues are"} on pages this crawl did not reach, so they count as neither fixed nor open.`
        : "",
      onNewPages > 0
        ? `${onNewPages} of today's issues are on pages the earlier crawl did not reach, so they do not count as new.`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
  changesByIssue: "Changes by issue",

  prioritiesIntro:
    "Every kind of issue found, most severe first, then by the search traffic of the affected pages.",
  clicks: "Clicks",
  impressions: "Impressions",
  impressionsShort: "impr.",
  trafficNote: (start, end) =>
    `Clicks and impressions are Google Search Console totals for the affected pages, ${start} to ${end}. Within each severity, issues on pages with more search traffic come first.`,
  topPages: "Where search traffic is at stake",
  topPagesIntro:
    "The pages with open issues that Google shows most often. Fixes here reach the most searchers.",
  page: "Page",
  issues: "Issues",

  ai: "AI search readiness",
  aiIntro:
    "How well AI assistants such as ChatGPT, Claude, Perplexity and Gemini can read this site and cite it in their answers.",
  crawlerAccess: "AI crawlers allowed in robots.txt",
  crawlerAccessValue: (allowed, total) => `${allowed} of ${total}`,
  crawlerAccessText:
    "A blocked search crawler cannot bring the site into that assistant's answers. Blocking training crawlers is a business decision and does not affect answers that come from a live search.",
  crawlerAccessUnknown:
    "robots.txt could not be read when this report was made, so crawler access is not known.",
  crawler: "Crawler",
  operator: "Operator",
  usedFor: "Used for",
  purpose: {
    training: "Model training",
    search: "AI search",
    user: "Pages a user asks about",
  },
  allowed: "Allowed",
  blocked: "Blocked",
  unknown: "Not known",
  noJavaScript: "Content readable without JavaScript",
  noJavaScriptText:
    "Most AI crawlers read the HTML a server delivers and do not run JavaScript. Content that only appears in the browser is invisible to them.",
  structuredData: "Pages with structured data",
  structuredDataText:
    "Schema.org markup tells machines what a page is: a company, a product, an article, a set of questions and answers. It makes facts easier to extract and attribute.",
  pagesOf: (count, total, totalCount) =>
    `${count} of ${total} ${totalCount === 1 ? "page" : "pages"}`,
  llmsTxt: "llms.txt",
  llmsTxtText:
    "A proposed convention: a short Markdown overview of the site for language models. Few assistants read it so far, so it is optional, but it costs little to add.",
  present: "Present",
  absent: "Not present",
  aiMentions: "Brand in AI answers",
  aiMentionsText: ({ mentionRate, citationRate, answers, days }) =>
    `AI assistants named the brand in ${mentionRate} of ${answers} answers to the tracked prompts over the last ${days} days${citationRate ? ` and cited the site as a source in ${citationRate}` : ""}. Prompts that name the brand themselves are left out.`,
};

const de: InsightStrings = {
  progress: "Fortschritt seit dem letzten Audit",
  progressIntro: (date) =>
    `Was sich gegenüber dem Audit vom ${date} verändert hat.`,
  fixed: "Behoben",
  added: "Neu",
  stillOpen: "Weiterhin offen",
  issuesThen: "Befunde damals",
  issuesNow: "Befunde heute",
  noChange:
    "Es wurden dieselben Befunde auf denselben Seiten festgestellt wie beim letzten Mal.",
  coverageNote: (notRechecked, onNewPages) =>
    [
      notRechecked > 0
        ? `${notRechecked === 1 ? "Ein früherer Befund liegt" : `${notRechecked} frühere Befunde liegen`} auf Seiten, die dieser Crawl nicht erreicht hat, und ${notRechecked === 1 ? "zählt" : "zählen"} daher weder als behoben noch als offen.`
        : "",
      onNewPages > 0
        ? `${onNewPages === 1 ? "Ein heutiger Befund liegt" : `${onNewPages} der heutigen Befunde liegen`} auf Seiten, die der frühere Crawl nicht erreicht hat, und ${onNewPages === 1 ? "zählt" : "zählen"} daher nicht als neu.`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
  changesByIssue: "Veränderungen je Befund",

  prioritiesIntro:
    "Alle festgestellten Befundarten, nach Schweregrad und danach nach dem Suchverkehr der betroffenen Seiten geordnet.",
  clicks: "Klicks",
  impressions: "Impressionen",
  impressionsShort: "Impr.",
  trafficNote: (start, end) =>
    `Klicks und Impressionen sind die Summen der betroffenen Seiten aus der Google Search Console, ${start} bis ${end}. Innerhalb eines Schweregrads stehen Befunde auf Seiten mit mehr Suchverkehr zuerst.`,
  topPages: "Wo Suchverkehr auf dem Spiel steht",
  topPagesIntro:
    "Die Seiten mit offenen Befunden, die Google am häufigsten anzeigt. Korrekturen erreichen hier die meisten Suchenden.",
  page: "Seite",
  issues: "Befunde",

  ai: "Bereit für die KI-Suche",
  aiIntro:
    "Wie gut KI-Assistenten wie ChatGPT, Claude, Perplexity und Gemini diese Website lesen und in ihren Antworten zitieren können.",
  crawlerAccess: "In der robots.txt zugelassene KI-Crawler",
  crawlerAccessValue: (allowed, total) => `${allowed} von ${total}`,
  crawlerAccessText:
    "Ein gesperrter Such-Crawler kann die Website nicht in die Antworten des jeweiligen Assistenten bringen. Trainings-Crawler zu sperren ist eine Geschäftsentscheidung und betrifft Antworten aus einer Live-Suche nicht.",
  crawlerAccessUnknown:
    "Die robots.txt war bei der Erstellung dieses Berichts nicht lesbar; der Crawler-Zugriff ist daher nicht bekannt.",
  crawler: "Crawler",
  operator: "Betreiber",
  usedFor: "Zweck",
  purpose: {
    training: "Modelltraining",
    search: "KI-Suche",
    user: "Von Nutzern angefragte Seiten",
  },
  allowed: "Zugelassen",
  blocked: "Gesperrt",
  unknown: "Nicht bekannt",
  noJavaScript: "Inhalte ohne JavaScript lesbar",
  noJavaScriptText:
    "Die meisten KI-Crawler lesen das HTML, das der Server ausliefert, und führen kein JavaScript aus. Inhalte, die erst im Browser entstehen, bleiben für sie unsichtbar.",
  structuredData: "Seiten mit strukturierten Daten",
  structuredDataText:
    "Schema.org-Auszeichnungen sagen Maschinen, was eine Seite ist: ein Unternehmen, ein Produkt, ein Artikel, eine Reihe von Fragen und Antworten. Fakten lassen sich so leichter entnehmen und zuordnen.",
  pagesOf: (count, total, totalCount) =>
    `${count} von ${total} ${totalCount === 1 ? "Seite" : "Seiten"}`,
  llmsTxt: "llms.txt",
  llmsTxtText:
    "Eine vorgeschlagene Konvention: eine kurze Markdown-Übersicht der Website für Sprachmodelle. Bislang lesen sie nur wenige Assistenten, sie ist also optional, lässt sich aber mit wenig Aufwand ergänzen.",
  present: "Vorhanden",
  absent: "Nicht vorhanden",
  aiMentions: "Marke in KI-Antworten",
  aiMentionsText: ({ mentionRate, citationRate, answers, days }) =>
    `KI-Assistenten haben die Marke in den letzten ${days} Tagen in ${mentionRate} von ${answers} Antworten auf die beobachteten Prompts genannt${citationRate ? ` und die Website in ${citationRate} als Quelle zitiert` : ""}. Prompts, die die Marke selbst nennen, sind nicht mitgezählt.`,
};

export const INSIGHT_STRINGS: Record<ReportLanguage, InsightStrings> = {
  en,
  de,
};
