import type { ReportFormat } from "@/client/features/audit/report/reportFormat";
import { Section, truncate } from "@/client/features/audit/report/reportParts";
import { buildStartPageAreas } from "@/client/features/audit/report/reportStartPageChecks";
import {
  overallScore,
  type CheckStatus,
  type StartPage,
} from "@/client/features/audit/report/reportStartPage";

const MAX_OUTLINE_HEADINGS = 24;

const STATUS_COLOR: Record<CheckStatus, string> = {
  good: "#1F7A52",
  improve: "#A86A00",
  fix: "#B3332A",
  note: "#6C6C78",
};

const STRINGS = {
  en: {
    title: "Start page check",
    intro: (url: string) =>
      `A closer look at ${url} on its own: its head, content, structure, links and how the server answers. Read when this report was made.`,
    lead: (score: number, fix: number, improve: number) =>
      `The start page passes ${score} percent of the checks below. ${fix === 0 ? "Nothing needs fixing urgently" : `${fix} ${fix === 1 ? "point needs" : "points need"} fixing`}${improve > 0 ? `, ${improve} could be better` : ""}.`,
    area: "Area",
    score: "Score",
    toFix: "To fix",
    toImprove: "To improve",
    check: "Check",
    finding: "Finding",
    status: { good: "Good", improve: "Improve", fix: "Fix", note: "Info" },
    serp: "How the page may look in Google",
    serpNote:
      "Search engines rewrite titles and snippets at will, so this is the starting point they get, not a guarantee.",
    noTitle: "(no title)",
    noDescription: "(no meta description; Google will pick text from the page)",
    outline: "Heading outline",
    outlineMore: (count: number) => `and ${count} more headings`,
    keywords: "Most used words",
    keywordsIntro:
      "The words the page uses most often, and whether the title, description and main heading pick them up. If the page's main topic is missing here, the text is not about what the page should rank for.",
    word: "Word",
    uses: "Uses",
    inTitle: "Title",
    inDescription: "Description",
    inH1: "H1",
    yes: "Yes",
    no: "–",
  },
  de: {
    title: "Prüfung der Startseite",
    intro: (url: string) =>
      `Ein genauer Blick auf ${url} allein: Kopfbereich, Inhalt, Struktur, Links und die Antwort des Servers. Abgerufen bei der Erstellung dieses Berichts.`,
    lead: (score: number, fix: number, improve: number) =>
      `Die Startseite besteht ${score} Prozent der folgenden Prüfungen. ${fix === 0 ? "Dringend zu beheben ist nichts" : `${fix} ${fix === 1 ? "Punkt sollte" : "Punkte sollten"} behoben werden`}${improve > 0 ? `, ${improve} ${improve === 1 ? "lässt" : "lassen"} sich verbessern` : ""}.`,
    area: "Bereich",
    score: "Wert",
    toFix: "Beheben",
    toImprove: "Verbessern",
    check: "Prüfung",
    finding: "Ergebnis",
    status: {
      good: "Gut",
      improve: "Verbessern",
      fix: "Beheben",
      note: "Info",
    },
    serp: "So kann die Seite bei Google erscheinen",
    serpNote:
      "Suchmaschinen schreiben Titel und Snippets nach eigenem Ermessen um. Das hier ist ihre Vorlage, keine Garantie.",
    noTitle: "(kein Titel)",
    noDescription:
      "(keine Meta-Description; Google wählt selbst Text von der Seite)",
    outline: "Gliederung der Überschriften",
    outlineMore: (count: number) => `und ${count} weitere Überschriften`,
    keywords: "Häufigste Wörter",
    keywordsIntro:
      "Die Wörter, die auf der Seite am häufigsten vorkommen, und ob Titel, Description und Hauptüberschrift sie aufgreifen. Fehlt das eigentliche Thema der Seite in dieser Liste, handelt der Text nicht von dem, wofür die Seite ranken soll.",
    word: "Wort",
    uses: "Anzahl",
    inTitle: "Titel",
    inDescription: "Description",
    inH1: "H1",
    yes: "Ja",
    no: "–",
  },
} as const;

/** A one-URL check of the start page, in the manner of single-page SEO checkers. */
export function StartPageSection({
  page,
  format: { language, number },
}: {
  page: StartPage | null;
  format: ReportFormat;
}) {
  if (!page) return null;
  const s = STRINGS[language];
  const areas = buildStartPageAreas(page, language);
  const score = overallScore(areas);
  const all = areas.flatMap((entry) => entry.checks);
  const fix = all.filter((check) => check.status === "fix").length;
  const improve = all.filter((check) => check.status === "improve").length;
  const url = new URL(page.url);
  const crumbs = [url.hostname, ...url.pathname.split("/").filter(Boolean)];

  return (
    <Section title={s.title} intro={s.intro(page.url)}>
      {score != null ? (
        <p className="lead">{s.lead(score, fix, improve)}</p>
      ) : null}

      <table className="block-table">
        <thead>
          <tr>
            <th>{s.area}</th>
            <th className="num">{s.score}</th>
            <th className="num">{s.toFix}</th>
            <th className="num">{s.toImprove}</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((entry) => (
            <tr key={entry.id}>
              <td className="strong">{entry.title}</td>
              <td className="num strong">
                {entry.score == null ? "–" : `${entry.score} / 100`}
              </td>
              <td className="num">
                {number(entry.checks.filter((c) => c.status === "fix").length)}
              </td>
              <td className="num">
                {number(
                  entry.checks.filter((c) => c.status === "improve").length,
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="block">
        <h3>{s.serp}</h3>
        <div className="serp">
          <div className="serp-url">{crumbs.join(" › ")}</div>
          <div className="serp-title">
            {page.title ? truncate(page.title, 61) : s.noTitle}
          </div>
          <div className="serp-text">
            {page.metaDescription
              ? truncate(page.metaDescription, 161)
              : s.noDescription}
          </div>
        </div>
        <p className="caption">{s.serpNote}</p>
      </div>

      {areas.map((entry) => (
        <div key={entry.id} className="block">
          <h3>
            {entry.title}
            {entry.score == null ? null : (
              <span className="h3-aside">{entry.score} / 100</span>
            )}
          </h3>
          <table className="checks">
            <thead>
              <tr>
                <th>{s.check}</th>
                <th>{s.finding}</th>
                <th className="num" />
              </tr>
            </thead>
            <tbody>
              {entry.checks.map((check) => (
                <tr key={check.name}>
                  <td className="strong">{check.name}</td>
                  <td>{check.finding}</td>
                  <td
                    className="num strong"
                    style={{ color: STATUS_COLOR[check.status] }}
                  >
                    {s.status[check.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {page.headings.length > 0 ? (
        <div className="block">
          <h3>{s.outline}</h3>
          <ol className="outline">
            {page.headings.slice(0, MAX_OUTLINE_HEADINGS).map((heading, i) => (
              <li
                key={i}
                style={{ paddingLeft: `${(heading.level - 1) * 5}mm` }}
              >
                <span className="muted">H{heading.level}</span>
                {heading.text || "–"}
              </li>
            ))}
          </ol>
          {page.headings.length > MAX_OUTLINE_HEADINGS ? (
            <p className="caption">
              {s.outlineMore(page.headings.length - MAX_OUTLINE_HEADINGS)}
            </p>
          ) : null}
        </div>
      ) : null}

      {page.keywords.length > 0 ? (
        <div className="block">
          <h3>{s.keywords}</h3>
          <p className="block-intro">{s.keywordsIntro}</p>
          <table className="keywords">
            <thead>
              <tr>
                <th>{s.word}</th>
                <th className="num">{s.uses}</th>
                <th className="num">{s.inTitle}</th>
                <th className="num">{s.inDescription}</th>
                <th className="num">{s.inH1}</th>
              </tr>
            </thead>
            <tbody>
              {page.keywords.map((keyword) => (
                <tr key={keyword.term}>
                  <td className="strong">{keyword.term}</td>
                  <td className="num">{number(keyword.count)}</td>
                  <Flag value={keyword.inTitle} yes={s.yes} no={s.no} />
                  <Flag value={keyword.inDescription} yes={s.yes} no={s.no} />
                  <Flag value={keyword.inH1} yes={s.yes} no={s.no} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Section>
  );
}

function Flag({ value, yes, no }: { value: boolean; yes: string; no: string }) {
  return <td className={value ? "num" : "num muted"}>{value ? yes : no}</td>;
}
