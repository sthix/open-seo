import type { ReactNode } from "react";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import { scoreTone } from "@/client/features/audit/shared";
import type { IssueSeverity } from "@/shared/audit-issues";

type Lighthouse = AuditResultsData["lighthouse"][number];

export const SEVERITIES: IssueSeverity[] = ["critical", "warning", "info"];

export const SEVERITY_COLOR: Record<IssueSeverity, string> = {
  critical: "#B3332A",
  warning: "#A86A00",
  info: "#3F5F8F",
};

const SCORE_COLOR = {
  success: "#1F7A52",
  warning: "#A86A00",
  destructive: "#B3332A",
} as const;

export function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {intro ? <p>{intro}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function CoverStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="cover-value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export function Tile({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="tile">
      <div className="tile-value" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}

export function Dot({ color }: { color: string }) {
  return <i className="dot" style={{ background: color }} />;
}

export function SeverityLabel({
  severity,
  label,
}: {
  severity: IssueSeverity;
  label: string;
}) {
  return (
    <span className="severity" style={{ color: SEVERITY_COLOR[severity] }}>
      {label}
    </span>
  );
}

export function SeverityBar({
  counts,
  className,
}: {
  counts: Record<IssueSeverity, number>;
  className?: string;
}) {
  return (
    <div className={className ? `bar ${className}` : "bar"}>
      {SEVERITIES.map((severity) =>
        counts[severity] > 0 ? (
          <span
            key={severity}
            style={{
              flexGrow: counts[severity],
              background: SEVERITY_COLOR[severity],
            }}
          />
        ) : null,
      )}
    </div>
  );
}

export function scoreColor(score: number | null): string | undefined {
  const tone = scoreTone(score);
  return tone ? SCORE_COLOR[tone] : undefined;
}

export function PerformanceCells({
  row,
  locale,
}: {
  row: Lighthouse;
  locale: string;
}) {
  const seconds = (ms: number | null) =>
    ms == null
      ? "–"
      : `${(ms / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
  const millis = (ms: number | null) =>
    ms == null ? "–" : `${Math.round(ms).toLocaleString(locale)} ms`;
  return (
    <>
      <ScoreCell score={row.performanceScore} />
      <ScoreCell score={row.seoScore} />
      <td className="num">{seconds(row.lcpMs)}</td>
      <td className="num">
        {row.cls == null
          ? "–"
          : row.cls.toLocaleString(locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
      </td>
      <td className="num">{millis(row.inpMs)}</td>
      <td className="num">{millis(row.ttfbMs)}</td>
    </>
  );
}

function ScoreCell({ score }: { score: number | null }) {
  const tone = scoreTone(score);
  return (
    <td
      className="num strong"
      style={tone ? { color: SCORE_COLOR[tone] } : undefined}
    >
      {score ?? "–"}
    </td>
  );
}

export function statusColor(code: number | null): string | undefined {
  if (!code) return undefined;
  if (code < 300) return SCORE_COLOR.success;
  if (code < 400) return SCORE_COLOR.warning;
  return SCORE_COLOR.destructive;
}

/** A page on the audited host prints as its path; anything else in full. */
export function displayUrl(url: string, host: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== host) return truncate(url, 110);
    return truncate(`${parsed.pathname}${parsed.search}`, 110);
  } catch {
    return truncate(url, 110);
  }
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
