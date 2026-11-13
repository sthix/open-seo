import { sortBy } from "remeda";
import { isLighthouseFailure } from "@/client/features/audit/results/AuditResultsTableFilterLogic";
import type { groupIssues } from "@/client/features/audit/results/IssuesView";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import {
  PerformanceCells,
  Section,
  SEVERITY_COLOR,
  SeverityLabel,
  statusColor,
  truncate,
} from "@/client/features/audit/report/reportParts";
import type { ReportStrings } from "@/client/features/audit/report/reportStrings";

/** Rows a section prints before it points at the CSV export instead. */
const MAX_URLS_PER_FINDING = 8;
const MAX_PERFORMANCE_ROWS = 40;
const MAX_PAGE_ROWS = 100;

/** What every section needs to print text, numbers and URLs. */
export interface ReportFormat {
  t: ReportStrings;
  number: (value: number) => string;
  /** A page on the audited host as its path; anything else in full. */
  path: (url: string) => string;
}

/** The ranked list of issue kinds, then one card per kind. */
export function IssueSections({
  groups,
  format: { t, number, path },
}: {
  groups: ReturnType<typeof groupIssues>;
  format: ReportFormat;
}) {
  if (groups.length === 0) return null;
  return (
    <>
      <Section title={t.priorities} intro={t.prioritiesIntro}>
        <table>
          <thead>
            <tr>
              <th className="num">#</th>
              <th>{t.issue}</th>
              <th />
              <th className="num">{t.pages}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, index) => (
              <tr key={group.issueType}>
                <td className="num muted">{index + 1}</td>
                <td className="strong">{group.title}</td>
                <td>
                  <SeverityLabel
                    severity={group.severity}
                    label={t.severity[group.severity]}
                  />
                </td>
                <td className="num strong">{number(group.issues.length)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title={t.details} intro={t.detailsIntro}>
        {groups.map((group, index) => (
          <article
            key={group.issueType}
            className="finding"
            style={{ borderColor: SEVERITY_COLOR[group.severity] }}
          >
            <header>
              <h3>
                <span className="muted">{index + 1}</span>
                {group.title}
              </h3>
              <SeverityLabel
                severity={group.severity}
                label={t.severity[group.severity]}
              />
            </header>
            {group.explanation || group.howToFix ? (
              <div className="finding-text">
                <div>
                  <h4>{t.whyItMatters}</h4>
                  <p>{group.explanation}</p>
                </div>
                <div>
                  <h4>{t.howToFix}</h4>
                  <p>{group.howToFix}</p>
                </div>
              </div>
            ) : null}
            <h4>{t.affectedPages(group.issues.length)}</h4>
            <ul className="urls">
              {group.issues.slice(0, MAX_URLS_PER_FINDING).map((issue) => (
                <li key={issue.id}>{path(issue.pageUrl)}</li>
              ))}
              {group.issues.length > MAX_URLS_PER_FINDING ? (
                <li className="more">
                  {t.andMore(group.issues.length - MAX_URLS_PER_FINDING)}
                </li>
              ) : null}
            </ul>
          </article>
        ))}
      </Section>
    </>
  );
}

export function PerformanceSection({
  data: { lighthouse, pages },
  format: { t, path },
}: {
  data: AuditResultsData;
  format: ReportFormat;
}) {
  if (lighthouse.length === 0) return null;
  const pageUrlById = new Map(pages.map((page) => [page.id, page.url]));
  const performanceRows = sortBy(
    lighthouse,
    (row) => row.performanceScore ?? 101,
  ).slice(0, MAX_PERFORMANCE_ROWS);
  return (
    <Section
      title={t.performanceTitle}
      intro={t.performanceIntro(performanceRows.length, lighthouse.length)}
    >
      <table>
        <thead>
          <tr>
            <th>{t.url}</th>
            <th>{t.device}</th>
            <th className="num">{t.performance}</th>
            <th className="num">{t.seo}</th>
            <th className="num">LCP</th>
            <th className="num">CLS</th>
            <th className="num">INP</th>
            <th className="num">TTFB</th>
          </tr>
        </thead>
        <tbody>
          {performanceRows.map((row) => (
            <tr key={row.id}>
              <td className="url">{path(pageUrlById.get(row.pageId) ?? "")}</td>
              <td>{row.strategy === "mobile" ? t.mobile : t.desktop}</td>
              {isLighthouseFailure(row) ? (
                <td colSpan={6} className="muted">
                  {t.failed}
                </td>
              ) : (
                <PerformanceCells row={row} locale={t.locale} />
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

export function PagesSection({
  pages,
  format: { t, number, path },
}: {
  pages: AuditResultsData["pages"];
  format: ReportFormat;
}) {
  if (pages.length === 0) return null;
  const pageRows = pages.slice(0, MAX_PAGE_ROWS);
  return (
    <Section
      title={t.crawledPages}
      intro={t.crawledPagesIntro(pageRows.length, pages.length)}
    >
      <table>
        <thead>
          <tr>
            <th>{t.url}</th>
            <th className="num">{t.status}</th>
            <th>{t.title}</th>
            <th className="num">{t.words}</th>
            <th className="num">{t.response}</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((page) => (
            <tr key={page.id}>
              <td className="url">{path(page.url)}</td>
              <td
                className="num strong"
                style={{ color: statusColor(page.statusCode) }}
              >
                {page.statusCode ?? "–"}
              </td>
              <td>{truncate(page.title ?? "", 70) || "–"}</td>
              <td className="num">{number(page.wordCount)}</td>
              <td className="num">
                {page.responseTimeMs == null
                  ? "–"
                  : `${number(page.responseTimeMs)} ms`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
