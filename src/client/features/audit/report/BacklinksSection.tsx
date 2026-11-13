import type { ReportFormat } from "@/client/features/audit/report/reportFormat";
import type { AuditReportContext } from "@/client/features/audit/report/reportInsights";
import {
  Section,
  Tile,
  truncate,
} from "@/client/features/audit/report/reportParts";

type Backlinks = NonNullable<AuditReportContext["backlinks"]>;

const STRINGS = {
  en: {
    title: "Backlinks",
    intro:
      "Links from other websites to this one: still one of the strongest signals for how much search engines and AI assistants trust a site. Figures from the DataForSEO link index, read when this report was made.",
    lead: (target: string, backlinks: string, domains: string) =>
      `${target} has ${backlinks} known backlinks from ${domains} different websites. What counts is mainly the number of distinct, relevant websites that link, not the total number of links.`,
    none: (target: string) =>
      `The link index knows no backlinks to ${target} yet. For a young or small site that is common, and it is the biggest lever outside the site itself.`,
    backlinks: "Backlinks",
    referringDomains: "Linking websites",
    referringPages: "Linking pages",
    rank: "Domain rank (0 to 1,000)",
    brokenBacklinks: "Links to error pages",
    spamScore: "Spam score of the links",
    brokenNote: (links: string, pages: string) =>
      `${links} backlinks point at ${pages} pages that return an error. Their value is lost until those URLs redirect (301) to the closest live page.`,
    trend: "Development over the last months",
    month: "Month",
    strongestDomains: "Strongest linking websites",
    strongestDomainsIntro:
      "Ranked by the strength of the linking website, with spam filtered out.",
    domain: "Website",
    links: "Links",
    firstSeen: "First seen",
    strongestLinks: "Strongest individual links",
    strongestLinksIntro:
      "One link per website, strongest first. The anchor text is the clickable text that tells search engines what the target is about.",
    from: "Linking page",
    anchor: "Anchor text",
    to: "Target",
    follow: "Followed",
    yes: "Yes",
    no: "No",
    noAnchor: "(image or no text)",
    topPages: "Pages that earn the most links",
    page: "Page",
    rankShort: "Rank",
  },
  de: {
    title: "Backlinks",
    intro:
      "Links von anderen Websites auf diese: nach wie vor eines der stärksten Signale dafür, wie sehr Suchmaschinen und KI-Assistenten einer Website vertrauen. Zahlen aus dem Linkindex von DataForSEO, abgerufen bei der Erstellung dieses Berichts.",
    lead: (target: string, backlinks: string, domains: string) =>
      `Auf ${target} verweisen ${backlinks} bekannte Backlinks von ${domains} verschiedenen Websites. Entscheidend ist vor allem die Zahl unterschiedlicher, thematisch passender Websites, nicht die Gesamtzahl der Links.`,
    none: (target: string) =>
      `Der Linkindex kennt noch keine Backlinks auf ${target}. Für eine junge oder kleine Website ist das üblich, und genau hier liegt der größte Hebel außerhalb der Website selbst.`,
    backlinks: "Backlinks",
    referringDomains: "Verweisende Websites",
    referringPages: "Verweisende Seiten",
    rank: "Domain-Rang (0 bis 1.000)",
    brokenBacklinks: "Links auf Fehlerseiten",
    spamScore: "Spam-Score der Links",
    brokenNote: (links: string, pages: string) =>
      `${links} Backlinks zeigen auf ${pages} Seiten, die einen Fehler liefern. Ihr Wert geht verloren, bis diese URLs per 301 auf die passendste erreichbare Seite weiterleiten.`,
    trend: "Entwicklung der letzten Monate",
    month: "Monat",
    strongestDomains: "Stärkste verweisende Websites",
    strongestDomainsIntro:
      "Nach Stärke der verweisenden Website geordnet, Spam herausgefiltert.",
    domain: "Website",
    links: "Links",
    firstSeen: "Zuerst gesehen",
    strongestLinks: "Stärkste einzelne Links",
    strongestLinksIntro:
      "Ein Link je Website, der stärkste zuerst. Der Ankertext ist der klickbare Text, der Suchmaschinen sagt, worum es auf der Zielseite geht.",
    from: "Verweisende Seite",
    anchor: "Ankertext",
    to: "Ziel",
    follow: "Follow",
    yes: "Ja",
    no: "Nein",
    noAnchor: "(Bild oder kein Text)",
    topPages: "Seiten mit den meisten Backlinks",
    page: "Seite",
    rankShort: "Rang",
  },
} as const;

/** The domain's link profile, as single-page checkers report "external factors". */
export function BacklinksSection({
  backlinks,
  format: { language, number, date, path },
}: {
  backlinks: Backlinks | null;
  format: ReportFormat;
}) {
  if (!backlinks) return null;
  const s = STRINGS[language];
  const { summary } = backlinks;
  const count = (value: number | null) => (value == null ? "–" : number(value));
  const month = (value: string) =>
    new Date(value).toLocaleDateString(language === "de" ? "de-DE" : "en-GB", {
      month: "long",
      year: "numeric",
    });
  const hasLinks = (summary.backlinks ?? 0) > 0;

  return (
    <Section title={s.title} intro={s.intro}>
      <p className="lead">
        {hasLinks
          ? s.lead(
              backlinks.target,
              count(summary.backlinks),
              count(summary.referringDomains),
            )
          : s.none(backlinks.target)}
      </p>

      {hasLinks ? (
        <div className="tiles">
          <Tile
            value={count(summary.referringDomains)}
            label={s.referringDomains}
          />
          <Tile value={count(summary.backlinks)} label={s.backlinks} />
          <Tile
            value={count(summary.referringPages)}
            label={s.referringPages}
          />
          <Tile value={count(summary.rank)} label={s.rank} />
          <Tile
            value={count(summary.brokenBacklinks)}
            label={s.brokenBacklinks}
          />
          <Tile
            value={
              summary.backlinksSpamScore == null
                ? "–"
                : `${summary.backlinksSpamScore} / 100`
            }
            label={s.spamScore}
          />
        </div>
      ) : null}

      {(summary.brokenBacklinks ?? 0) > 0 && (summary.brokenPages ?? 0) > 0 ? (
        <p className="note">
          {s.brokenNote(
            count(summary.brokenBacklinks),
            count(summary.brokenPages),
          )}
        </p>
      ) : null}

      {backlinks.trends.length > 1 ? (
        <div className="block">
          <h3>{s.trend}</h3>
          <table>
            <thead>
              <tr>
                <th>{s.month}</th>
                <th className="num">{s.referringDomains}</th>
                <th className="num">{s.backlinks}</th>
                <th className="num">{s.rankShort}</th>
              </tr>
            </thead>
            <tbody>
              {backlinks.trends.map((point) => (
                <tr key={point.date}>
                  <td>{month(point.date)}</td>
                  <td className="num">{count(point.referringDomains)}</td>
                  <td className="num">{count(point.backlinks)}</td>
                  <td className="num">{count(point.rank)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {backlinks.referringDomains.length > 0 ? (
        <div className="block">
          <h3>{s.strongestDomains}</h3>
          <p className="block-intro">{s.strongestDomainsIntro}</p>
          <table>
            <thead>
              <tr>
                <th>{s.domain}</th>
                <th className="num">{s.rankShort}</th>
                <th className="num">{s.links}</th>
                <th className="num">{s.firstSeen}</th>
              </tr>
            </thead>
            <tbody>
              {backlinks.referringDomains.map((row) => (
                <tr key={row.domain ?? ""}>
                  <td className="strong">{row.domain ?? "–"}</td>
                  <td className="num">{count(row.rank)}</td>
                  <td className="num">{count(row.backlinks)}</td>
                  <td className="num">
                    {row.firstSeen ? date(row.firstSeen) : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {backlinks.backlinks.length > 0 ? (
        <div className="block">
          <h3>{s.strongestLinks}</h3>
          <p className="block-intro">{s.strongestLinksIntro}</p>
          <table>
            <thead>
              <tr>
                <th>{s.from}</th>
                <th>{s.anchor}</th>
                <th>{s.to}</th>
                <th className="num">{s.follow}</th>
              </tr>
            </thead>
            <tbody>
              {backlinks.backlinks.map((row, index) => (
                <tr key={`${row.urlFrom}-${index}`}>
                  <td className="url">{truncate(row.urlFrom ?? "–", 70)}</td>
                  <td>
                    {row.anchor ? (
                      truncate(row.anchor, 60)
                    ) : (
                      <span className="muted">{s.noAnchor}</span>
                    )}
                  </td>
                  <td className="url">{row.urlTo ? path(row.urlTo) : "–"}</td>
                  <td className="num">
                    {row.isDofollow == null
                      ? "–"
                      : row.isDofollow
                        ? s.yes
                        : s.no}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {backlinks.topPages.length > 0 ? (
        <div className="block">
          <h3>{s.topPages}</h3>
          <table>
            <thead>
              <tr>
                <th>{s.page}</th>
                <th className="num">{s.referringDomains}</th>
                <th className="num">{s.backlinks}</th>
                <th className="num">{s.brokenBacklinks}</th>
              </tr>
            </thead>
            <tbody>
              {backlinks.topPages.map((row) => (
                <tr key={row.page ?? ""}>
                  <td className="url">{row.page ? path(row.page) : "–"}</td>
                  <td className="num">{count(row.referringDomains)}</td>
                  <td className="num">{count(row.backlinks)}</td>
                  <td className="num">{count(row.brokenBacklinks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Section>
  );
}
