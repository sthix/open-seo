import { renderToStaticMarkup } from "react-dom/server";
import { isLighthouseFailure } from "@/client/features/audit/results/AuditResultsTableFilterLogic";
import { groupIssues } from "@/client/features/audit/results/IssuesView";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import {
  IssueSections,
  PagesSection,
  PerformanceSection,
  type ReportFormat,
} from "@/client/features/audit/report/AuditReportSections";
import { ISSUE_TEXT_DE } from "@/client/features/audit/report/issueTextDe";
import { reportCss } from "@/client/features/audit/report/reportCss";
import {
  CoverStat,
  Dot,
  Gauge,
  Section,
  SEVERITIES,
  SEVERITY_COLOR,
  SeverityBar,
  Tile,
  displayUrl,
} from "@/client/features/audit/report/reportParts";
import {
  REPORT_STRINGS,
  type ReportLanguage,
} from "@/client/features/audit/report/reportStrings";
import {
  extractHostname,
  parseTimestamp,
} from "@/client/features/audit/shared";

const germanIssueText: Partial<
  Record<string, (typeof ISSUE_TEXT_DE)[keyof typeof ISSUE_TEXT_DE]>
> = ISSUE_TEXT_DE;

/**
 * The whole report as one self-contained HTML document, laid out for A4. The
 * caller opens it in a tab, where its own script calls print().
 */
export function renderAuditReportHtml(args: {
  data: AuditResultsData;
  language: ReportLanguage;
  /** Absolute URLs of the Inter font files the app already ships. */
  fonts: { latin: string; latinExt: string };
}): string {
  return `<!doctype html>${renderToStaticMarkup(<AuditReport {...args} />)}`;
}

function AuditReport({
  data,
  language,
  fonts,
}: {
  data: AuditResultsData;
  language: ReportLanguage;
  fonts: { latin: string; latinExt: string };
}) {
  const t = REPORT_STRINGS[language];
  const { audit, pages, lighthouse, issues } = data;
  const host = extractHostname(audit.startUrl);
  const auditedAt = parseTimestamp(audit.completedAt ?? audit.startedAt);
  const date = auditedAt.toLocaleDateString(t.locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const number = (value: number) => value.toLocaleString(t.locale);
  const format: ReportFormat = {
    t,
    number,
    path: (url) => displayUrl(url, host),
  };

  const groups = groupIssues(issues).map((group) => {
    const german = language === "de" ? germanIssueText[group.issueType] : null;
    return german ? { ...group, ...german } : group;
  });
  const severityCounts = { critical: 0, warning: 0, info: 0 };
  for (const group of groups) {
    severityCounts[group.severity] += group.issues.length;
  }
  const pagesWithIssues = new Set(issues.map((issue) => issue.pageUrl)).size;
  const incomplete = issues.some(
    (issue) =>
      issue.issueType === "crawl-rate-limited" ||
      issue.issueType === "rate-limited-page" ||
      issue.issueType === "blocked-page",
  );

  const timedPages = pages.filter((page) => page.responseTimeMs != null);
  const averageResponseMs =
    timedPages.length === 0
      ? null
      : Math.round(
          timedPages.reduce(
            (sum, page) => sum + (page.responseTimeMs ?? 0),
            0,
          ) / timedPages.length,
        );

  const statusBands = [
    { label: "2xx", color: "#1F8A5B", match: (code: number) => code < 300 },
    { label: "3xx", color: "#D9920F", match: (code: number) => code < 400 },
    { label: "4xx", color: "#C4352B", match: (code: number) => code < 500 },
    { label: "5xx", color: "#7A1F18", match: () => true },
  ];
  const statusCounts = [
    ...statusBands.map((band) => ({ ...band, count: 0 })),
    { label: t.statusNone, color: "#B9B9C4", count: 0 },
  ];
  for (const page of pages) {
    const code = page.statusCode;
    const index = code
      ? statusBands.findIndex((band) => band.match(code))
      : statusBands.length;
    statusCounts[index].count += 1;
  }

  const lighthouseOk = lighthouse.filter((row) => !isLighthouseFailure(row));
  const averageScore = (
    key:
      | "performanceScore"
      | "seoScore"
      | "accessibilityScore"
      | "bestPracticesScore",
  ) => {
    const values = lighthouseOk
      .map((row) => row[key])
      .filter((value) => value != null);
    if (values.length === 0) return null;
    return Math.round(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    );
  };
  const fileDate = Number.isNaN(auditedAt.getTime())
    ? ""
    : `-${auditedAt.toISOString().slice(0, 10)}`;

  return (
    <html lang={language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Browsers suggest the title as the PDF's file name. */}
        <title>{`${t.filePrefix}-${host}${fileDate}`}</title>
        <style
          dangerouslySetInnerHTML={{
            __html: reportCss({
              fonts,
              footer: t.footer(host),
              pageOf: t.pageOf,
            }),
          }}
        />
      </head>
      <body>
        <div className="toolbar">
          <span>{t.printHint}</span>
          <button id="print" type="button">
            {t.printButton}
          </button>
        </div>

        <section className="cover">
          <div className="cover-top">
            <span className="label">{t.kicker}</span>
            <span className="label">{date}</span>
          </div>
          <div>
            <h1 className={host.length > 24 ? "long" : undefined}>{host}</h1>
            <SeverityBar counts={severityCounts} className="cover-bar" />
          </div>
          <div className="cover-stats">
            <CoverStat
              value={number(audit.pagesCrawled)}
              label={t.pagesCrawled}
            />
            <CoverStat value={number(issues.length)} label={t.issuesFound} />
            {SEVERITIES.map((severity) => (
              <CoverStat
                key={severity}
                value={number(severityCounts[severity])}
                label={t.severity[severity]}
                color={SEVERITY_COLOR[severity]}
              />
            ))}
          </div>
        </section>

        <main className="content">
          <Section title={t.summary}>
            <p className="lead">
              {issues.length === 0
                ? t.noIssuesLead({ host, date, pages: audit.pagesCrawled })
                : t.summaryLead({
                    host,
                    date,
                    pages: audit.pagesCrawled,
                    issues: issues.length,
                    types: groups.length,
                  })}
            </p>
            {incomplete ? <p className="note">{t.incompleteNote}</p> : null}

            <div className="tiles">
              <Tile value={number(audit.pagesCrawled)} label={t.pagesCrawled} />
              <Tile value={number(issues.length)} label={t.issuesFound} />
              <Tile value={number(pagesWithIssues)} label={t.pagesAffected} />
              <Tile
                value={
                  averageResponseMs == null
                    ? "–"
                    : `${number(averageResponseMs)} ms`
                }
                label={t.avgResponse}
              />
            </div>

            {issues.length > 0 ? (
              <div className="block">
                <h3>{t.bySeverity}</h3>
                <SeverityBar counts={severityCounts} />
                <div className="legend">
                  {SEVERITIES.map((severity) => (
                    <div key={severity}>
                      <div className="legend-head">
                        <Dot color={SEVERITY_COLOR[severity]} />
                        <strong>{t.severity[severity]}</strong>
                        <span className="count">
                          {number(severityCounts[severity])}
                        </span>
                      </div>
                      <p>{t.severityHint[severity]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {pages.length > 0 ? (
              <div className="block">
                <h3>{t.statusCodes}</h3>
                <div className="bar">
                  {statusCounts.map((band) =>
                    band.count > 0 ? (
                      <span
                        key={band.label}
                        style={{ flexGrow: band.count, background: band.color }}
                      />
                    ) : null,
                  )}
                </div>
                <div className="inline-legend">
                  {statusCounts.map((band) =>
                    band.count > 0 ? (
                      <span key={band.label}>
                        <Dot color={band.color} />
                        {band.label}
                        <span className="count">{number(band.count)}</span>
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
            ) : null}

            {lighthouseOk.length > 0 ? (
              <div className="block">
                <h3>{t.lighthouse}</h3>
                <div className="gauges">
                  <Gauge
                    score={averageScore("performanceScore")}
                    label={t.performance}
                  />
                  <Gauge score={averageScore("seoScore")} label={t.seo} />
                  <Gauge
                    score={averageScore("accessibilityScore")}
                    label={t.accessibility}
                  />
                  <Gauge
                    score={averageScore("bestPracticesScore")}
                    label={t.bestPractices}
                  />
                </div>
                <p className="caption">
                  {t.lighthouseNote(
                    lighthouse.length,
                    lighthouse.length - lighthouseOk.length,
                  )}
                </p>
              </div>
            ) : null}
          </Section>

          <IssueSections groups={groups} format={format} />
          <PerformanceSection data={data} format={format} />
          <PagesSection pages={pages} format={format} />

          <div className="about">
            <h3>{t.about}</h3>
            <p>
              {t.aboutText({
                startUrl: audit.startUrl,
                maxPages: audit.config.maxPages,
                rendered: audit.config.renderJavaScript === true,
                lighthouse: lighthouse.length > 0,
              })}
            </p>
          </div>
        </main>

        {/* Prints once the font is in, so the PDF never falls back to a system face. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.getElementById("print").onclick=()=>print();addEventListener("load",()=>document.fonts.ready.then(()=>setTimeout(()=>print(),200)))',
          }}
        />
      </body>
    </html>
  );
}
