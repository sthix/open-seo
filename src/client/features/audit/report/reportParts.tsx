import type { ReactNode } from "react";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import { scoreTone } from "@/client/features/audit/shared";
import type { IssueSeverity } from "@/shared/audit-issues";

type Lighthouse = AuditResultsData["lighthouse"][number];

export const SEVERITIES: IssueSeverity[] = ["critical", "warning", "info"];

export const SEVERITY_COLOR: Record<IssueSeverity, string> = {
  critical: "#C4352B",
  warning: "#D9920F",
  info: "#4A74B8",
};

const SCORE_COLOR = {
  success: "#1F8A5B",
  warning: "#D9920F",
  destructive: "#C4352B",
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

export function CoverStat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div>
      <div className="cover-value">{value}</div>
      <div className="label">
        {color ? <Dot color={color} /> : null}
        {label}
      </div>
    </div>
  );
}

export function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="tile">
      <div className="tile-value">{value}</div>
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
      <Dot color={SEVERITY_COLOR[severity]} />
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

const GAUGE_RADIUS = 30;
const GAUGE_LENGTH = 2 * Math.PI * GAUGE_RADIUS;

export function Gauge({
  score,
  label,
}: {
  score: number | null;
  label: string;
}) {
  const tone = scoreTone(score);
  const color = tone ? SCORE_COLOR[tone] : "#B9B9C4";
  return (
    <div className="gauge">
      <svg viewBox="0 0 72 72" role="img" aria-label={`${label}: ${score}`}>
        <circle
          cx="36"
          cy="36"
          r={GAUGE_RADIUS}
          fill="none"
          stroke="#E6E6EC"
          strokeWidth="5"
        />
        {score != null ? (
          <circle
            cx="36"
            cy="36"
            r={GAUGE_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * GAUGE_LENGTH} ${GAUGE_LENGTH}`}
            transform="rotate(-90 36 36)"
          />
        ) : null}
        <text x="36" y="42" textAnchor="middle" fill={color}>
          {score ?? "–"}
        </text>
      </svg>
      <div className="label">{label}</div>
    </div>
  );
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
