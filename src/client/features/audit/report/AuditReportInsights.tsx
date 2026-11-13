import type { ReactNode } from "react";
import { sortBy } from "remeda";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import type { ReportFormat } from "@/client/features/audit/report/reportFormat";
import type { ReportIssueGroup } from "@/client/features/audit/report/reportGroups";
import {
  compareWithPrevious,
  type AuditReportContext,
} from "@/client/features/audit/report/reportInsights";
import {
  Dot,
  Section,
  SeverityLabel,
  Tile,
} from "@/client/features/audit/report/reportParts";
import {
  ISSUE_SEVERITY_ORDER,
  type IssueSeverity,
} from "@/shared/audit-issues";

const MAX_TOP_PAGES = 5;
const MAX_PROGRESS_ROWS = 14;

const GOOD = "#1F8A5B";
const WARN = "#D9920F";
const BAD = "#C4352B";
const NEUTRAL = "#B9B9C4";

/** The pages with open issues that get the most search impressions. */
export function TopPagesBlock({
  groups,
  format: { t, ti, number, path, traffic },
}: {
  groups: ReportIssueGroup[];
  format: ReportFormat;
}) {
  if (!traffic) return null;
  const byPage = new Map<string, { issues: number; worst: IssueSeverity }>();
  for (const group of groups) {
    for (const issue of group.issues) {
      const known = byPage.get(issue.pageUrl);
      const worst =
        known &&
        ISSUE_SEVERITY_ORDER[known.worst] <=
          ISSUE_SEVERITY_ORDER[group.severity]
          ? known.worst
          : group.severity;
      byPage.set(issue.pageUrl, { issues: (known?.issues ?? 0) + 1, worst });
    }
  }
  const rows = sortBy(
    [...byPage].map(([url, page]) => ({ url, ...page, ...traffic(url) })),
    [(row) => row.impressions, "desc"],
  )
    .filter((row) => row.impressions > 0)
    .slice(0, MAX_TOP_PAGES);
  if (rows.length === 0) return null;

  return (
    <div className="block top-pages">
      <h3>{ti.topPages}</h3>
      <p className="block-intro">{ti.topPagesIntro}</p>
      <table>
        <thead>
          <tr>
            <th>{ti.page}</th>
            <th className="num">{ti.issues}</th>
            <th />
            <th className="num">{ti.clicks}</th>
            <th className="num">{ti.impressions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.url}>
              <td className="url">{path(row.url)}</td>
              <td className="num strong">{number(row.issues)}</td>
              <td>
                <SeverityLabel
                  severity={row.worst}
                  label={t.severity[row.worst]}
                />
              </td>
              <td className="num">{number(row.clicks)}</td>
              <td className="num strong">{number(row.impressions)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Fixed, new and still-open issues against the previous audit of the site. */
export function ProgressSection({
  data,
  previous,
  format: { t, ti, number, date, issueTitle },
}: {
  data: AuditResultsData;
  previous: AuditReportContext["previous"];
  format: ReportFormat;
}) {
  if (!previous) return null;
  const progress = compareWithPrevious(data, previous);
  const coverageNote = ti.coverageNote(
    progress.notRechecked,
    progress.onNewPages,
  );
  const rows = progress.byType.slice(0, MAX_PROGRESS_ROWS);

  return (
    <Section
      title={ti.progress}
      intro={ti.progressIntro(date(previous.auditedAt))}
    >
      <div className="tiles five">
        <Tile
          value={number(progress.fixed)}
          label={ti.fixed}
          color={progress.fixed > 0 ? GOOD : undefined}
        />
        <Tile
          value={number(progress.added)}
          label={ti.added}
          color={progress.added > 0 ? BAD : undefined}
        />
        <Tile value={number(progress.open)} label={ti.stillOpen} />
        <Tile
          value={number(progress.previousIssueCount)}
          label={ti.issuesThen}
        />
        <Tile value={number(data.issues.length)} label={ti.issuesNow} />
      </div>
      {coverageNote ? <p className="caption">{coverageNote}</p> : null}

      {rows.length === 0 ? (
        <p className="block">{ti.noChange}</p>
      ) : (
        <div className="block">
          <h3>{ti.changesByIssue}</h3>
          <table>
            <thead>
              <tr>
                <th>{t.issue}</th>
                <th className="num">{ti.fixed}</th>
                <th className="num">{ti.added}</th>
                <th className="num">{ti.stillOpen}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.issueType}>
                  <td className="strong">{issueTitle(row.issueType)}</td>
                  <Change value={row.fixed} sign="−" color={GOOD} />
                  <Change value={row.added} sign="+" color={BAD} />
                  <td className="num">{number(row.open)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

function Change({
  value,
  sign,
  color,
}: {
  value: number;
  sign: string;
  color: string;
}) {
  return value > 0 ? (
    <td className="num strong" style={{ color }}>
      {sign}
      {value}
    </td>
  ) : (
    <td className="num muted">–</td>
  );
}

/** How well AI assistants can read and cite the site. */
export function AiSection({
  data: { pages, issues },
  context,
  format: { t, ti, number },
}: {
  data: AuditResultsData;
  context: AuditReportContext | null;
  format: ReportFormat;
}) {
  const htmlPages = pages.filter(
    (page) => page.statusCode === 200 && page.fetchClass === "ok",
  );
  if (htmlPages.length === 0) return null;
  const total = htmlPages.length;
  const needJavaScript = Math.min(
    total,
    issues.filter(
      (issue) => issue.issueType === "javascript-rendering-suspected",
    ).length,
  );
  const structured = htmlPages.filter((page) => page.hasStructuredData).length;
  const percent = (rate: number) =>
    (rate / 100).toLocaleString(t.locale, {
      style: "percent",
      maximumFractionDigits: 0,
    });

  const access = context?.aiCrawlerAccess;
  const crawlers = access?.crawlers;
  const blocked = crawlers?.filter((crawler) => !crawler.allowed) ?? [];
  const mentions = context?.aiMentions;

  return (
    <Section title={ti.ai} intro={ti.aiIntro}>
      {mentions ? (
        <Check
          color="#15151C"
          title={ti.aiMentions}
          value={percent(mentions.mentionRate)}
          text={ti.aiMentionsText({
            mentionRate: percent(mentions.mentionRate),
            citationRate:
              mentions.citationRate == null
                ? null
                : percent(mentions.citationRate),
            answers: mentions.answers,
            days: mentions.days,
          })}
        />
      ) : null}

      {access ? (
        <Check
          color={
            !crawlers
              ? NEUTRAL
              : blocked.some((crawler) => crawler.purpose !== "training")
                ? BAD
                : blocked.length > 0
                  ? WARN
                  : GOOD
          }
          title={ti.crawlerAccess}
          value={
            crawlers
              ? ti.crawlerAccessValue(
                  crawlers.length - blocked.length,
                  crawlers.length,
                )
              : ti.unknown
          }
          text={crawlers ? ti.crawlerAccessText : ti.crawlerAccessUnknown}
        >
          {crawlers ? (
            <table>
              <thead>
                <tr>
                  <th>{ti.crawler}</th>
                  <th>{ti.operator}</th>
                  <th>{ti.usedFor}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {crawlers.map((crawler) => (
                  <tr key={crawler.userAgent}>
                    <td className="strong">{crawler.userAgent}</td>
                    <td>{crawler.operator}</td>
                    <td>{ti.purpose[crawler.purpose]}</td>
                    <td
                      className="num severity"
                      style={{ color: crawler.allowed ? GOOD : BAD }}
                    >
                      <Dot color={crawler.allowed ? GOOD : BAD} />
                      {crawler.allowed ? ti.allowed : ti.blocked}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </Check>
      ) : null}

      <Check
        color={
          needJavaScript === 0
            ? GOOD
            : needJavaScript / total > 0.2
              ? BAD
              : WARN
        }
        title={ti.noJavaScript}
        value={ti.pagesOf(number(total - needJavaScript), number(total), total)}
        text={ti.noJavaScriptText}
      />

      <Check
        color={
          structured / total >= 0.8
            ? GOOD
            : structured / total >= 0.3
              ? WARN
              : BAD
        }
        title={ti.structuredData}
        value={ti.pagesOf(number(structured), number(total), total)}
        text={ti.structuredDataText}
      />

      {access && access.hasLlmsTxt != null ? (
        <Check
          color={access.hasLlmsTxt ? GOOD : NEUTRAL}
          title={ti.llmsTxt}
          value={access.hasLlmsTxt ? ti.present : ti.absent}
          text={ti.llmsTxtText}
        />
      ) : null}
    </Section>
  );
}

function Check({
  color,
  title,
  value,
  text,
  children,
}: {
  color: string;
  title: string;
  value: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="check" style={{ borderColor: color }}>
      <header>
        <h3>{title}</h3>
        <span
          className="check-value"
          style={{ color: color === NEUTRAL ? "#6C6C78" : color }}
        >
          {value}
        </span>
      </header>
      <p>{text}</p>
      {children}
    </div>
  );
}
