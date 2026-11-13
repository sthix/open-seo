import { sortBy } from "remeda";
import type { AuditReportContext } from "@/client/features/audit/report/reportInsights";

export type StartPage = NonNullable<AuditReportContext["startPage"]>;

/** "note" rows inform without counting towards the score. */
export type CheckStatus = "good" | "improve" | "fix" | "note";

export interface PageCheck {
  name: string;
  finding: string;
  status: CheckStatus;
}

export interface CheckArea {
  id: "meta" | "quality" | "structure" | "links" | "server";
  title: string;
  /** Share of scored checks passed, 0–100; null when nothing was scored. */
  score: number | null;
  checks: PageCheck[];
}

/** A finished check list: sorted worst first inside each area, then scored. */
export function area(
  id: CheckArea["id"],
  title: string,
  checks: PageCheck[],
): CheckArea {
  const order: Record<CheckStatus, number> = {
    fix: 0,
    improve: 1,
    good: 2,
    note: 3,
  };
  const scored = checks.filter((check) => check.status !== "note");
  const points = scored.reduce(
    (sum, check) =>
      sum +
      (check.status === "good" ? 1 : check.status === "improve" ? 0.5 : 0),
    0,
  );
  return {
    id,
    title,
    score:
      scored.length === 0 ? null : Math.round((points / scored.length) * 100),
    checks: sortBy(checks, (check) => order[check.status]),
  };
}

/** What every area's checks need to word their findings. */
export interface Words {
  page: StartPage;
  /** Picks the English or the German wording. */
  s: (en: string, german: string) => string;
  n: (value: number) => string;
}

export function overallScore(areas: CheckArea[]): number | null {
  const scores = areas
    .map((entry) => entry.score)
    .filter((score) => score != null);
  if (scores.length === 0) return null;
  return Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length,
  );
}

export function metaChecks({ page, s, n }: Words): CheckArea {
  const chars = (count: number) =>
    s(`${n(count)} characters`, `${n(count)} Zeichen`);
  const titleLength = page.title.length;
  const descriptionLength = page.metaDescription.length;
  const robots = [page.robotsMeta, page.xRobotsTag]
    .filter(Boolean)
    .join(", ")
    .toLowerCase();
  const noindex = robots.includes("noindex");
  const canonicalElsewhere =
    page.canonical != null &&
    stripSlash(resolve(page.canonical, page.url)) !== stripSlash(page.url);

  return area("meta", s("Meta information", "Meta-Angaben"), [
    {
      name: s("Page title", "Seitentitel"),
      finding: !page.title
        ? s("Missing.", "Fehlt.")
        : titleLength > 60
          ? s(
              `${chars(titleLength)}, will be cut off in search results (about 60 fit).`,
              `${chars(titleLength)}, wird in den Suchergebnissen abgeschnitten (etwa 60 passen).`,
            )
          : titleLength < 30
            ? s(
                `${chars(titleLength)}, room left for the page's topic (30 to 60 work best).`,
                `${chars(titleLength)}, hier ist noch Platz für das Thema der Seite (30 bis 60 sind ideal).`,
              )
            : s(`${chars(titleLength)}.`, `${chars(titleLength)}.`),
      status: !page.title
        ? "fix"
        : titleLength > 60 || titleLength < 30
          ? "improve"
          : "good",
    },
    {
      name: s("Meta description", "Meta-Description"),
      finding: !page.metaDescription
        ? s(
            "Missing. Search engines will pick a snippet from the page text.",
            "Fehlt. Suchmaschinen stellen das Snippet dann selbst aus dem Seitentext zusammen.",
          )
        : descriptionLength > 160
          ? s(
              `${chars(descriptionLength)}, will be cut off (about 160 fit).`,
              `${chars(descriptionLength)}, wird abgeschnitten (etwa 160 passen).`,
            )
          : descriptionLength < 70
            ? s(
                `${chars(descriptionLength)}, short of the 70 to 160 that fill a snippet.`,
                `${chars(descriptionLength)}, kürzer als die 70 bis 160, die ein Snippet füllen.`,
              )
            : s(`${chars(descriptionLength)}.`, `${chars(descriptionLength)}.`),
      status: !page.metaDescription
        ? "fix"
        : descriptionLength > 160 || descriptionLength < 70
          ? "improve"
          : "good",
    },
    {
      name: s("Indexing", "Indexierung"),
      finding: noindex
        ? s(
            `Search engines are told not to index the page (${robots}).`,
            `Suchmaschinen werden angewiesen, die Seite nicht zu indexieren (${robots}).`,
          )
        : s("The page may be indexed.", "Die Seite darf indexiert werden."),
      status: noindex ? "fix" : "good",
    },
    {
      name: s("Canonical URL", "Canonical-URL"),
      finding: !page.canonical
        ? s("Not set.", "Nicht gesetzt.")
        : canonicalElsewhere
          ? s(
              `Points to another URL: ${page.canonical}`,
              `Verweist auf eine andere URL: ${page.canonical}`,
            )
          : s("Points to the page itself.", "Verweist auf die Seite selbst."),
      status: !page.canonical || canonicalElsewhere ? "improve" : "good",
    },
    {
      name: s("Language", "Sprache"),
      finding: page.lang
        ? s(`Declared as “${page.lang}”.`, `Angegeben als „${page.lang}“.`)
        : s(
            "No lang attribute on <html>.",
            "Kein lang-Attribut am <html>-Element.",
          ),
      status: page.lang ? "good" : "improve",
    },
    {
      name: s("Language versions (hreflang)", "Sprachversionen (hreflang)"),
      finding:
        page.hreflangCount > 0
          ? s(
              `${n(page.hreflangCount)} declared.`,
              `${n(page.hreflangCount)} angegeben.`,
            )
          : s(
              "None declared. Only needed if the site exists in several languages or countries.",
              "Keine angegeben. Nur nötig, wenn es die Website in mehreren Sprachen oder Ländern gibt.",
            ),
      status: "note",
    },
    {
      name: s("Character encoding", "Zeichenkodierung"),
      finding: page.charset
        ? s(`Declared as ${page.charset}.`, `Angegeben als ${page.charset}.`)
        : s(
            "Not declared, so browsers have to guess and may garble umlauts.",
            "Nicht angegeben. Browser müssen raten und stellen Umlaute womöglich falsch dar.",
          ),
      status: page.charset ? "good" : "improve",
    },
    {
      name: s("Doctype", "Doctype"),
      finding: page.hasDoctype
        ? s("Declared.", "Angegeben.")
        : s(
            "Missing, so browsers render the page in quirks mode.",
            "Fehlt. Browser stellen die Seite dann im Quirks-Modus dar.",
          ),
      status: page.hasDoctype ? "good" : "improve",
    },
    {
      name: s("Favicon", "Favicon"),
      finding: page.hasFavicon
        ? s("Present.", "Vorhanden.")
        : s(
            "None found. Google shows the favicon next to mobile results.",
            "Keines gefunden. Google zeigt das Favicon neben mobilen Suchergebnissen.",
          ),
      status: page.hasFavicon ? "good" : "improve",
    },
  ]);
}

export function qualityChecks({ page, s, n }: Words): CheckArea {
  const topTerms = page.keywords.slice(0, 3);
  const termsInTitle = topTerms.filter(
    (keyword) => keyword.inTitle || keyword.inH1,
  );
  const missingAltShare =
    page.imagesTotal === 0 ? 0 : page.imagesMissingAlt / page.imagesTotal;

  return area("quality", s("Page quality", "Seitenqualität"), [
    {
      name: s("Amount of text", "Textmenge"),
      finding: s(`${n(page.wordCount)} words.`, `${n(page.wordCount)} Wörter.`),
      status:
        page.wordCount >= 300
          ? "good"
          : page.wordCount >= 150
            ? "improve"
            : "fix",
    },
    ...(topTerms.length > 0
      ? [
          {
            name: s("Keyword consistency", "Keyword-Konsistenz"),
            finding:
              termsInTitle.length > 0
                ? s(
                    `The most used words (${topTerms.map((k) => k.term).join(", ")}) also appear in the title or main heading.`,
                    `Die häufigsten Wörter (${topTerms.map((k) => k.term).join(", ")}) stehen auch im Titel oder in der Hauptüberschrift.`,
                  )
                : s(
                    `None of the most used words (${topTerms.map((k) => k.term).join(", ")}) appears in the title or main heading.`,
                    `Keines der häufigsten Wörter (${topTerms.map((k) => k.term).join(", ")}) steht im Titel oder in der Hauptüberschrift.`,
                  ),
            status: (termsInTitle.length > 0
              ? "good"
              : "improve") as CheckStatus,
          },
        ]
      : []),
    {
      name: s("Mobile viewport", "Mobiler Viewport"),
      finding: page.hasViewport
        ? s("Set.", "Gesetzt.")
        : s(
            "Not set, so phones show the desktop layout scaled down.",
            "Nicht gesetzt. Smartphones zeigen dann das verkleinerte Desktop-Layout.",
          ),
      status: page.hasViewport ? "good" : "fix",
    },
    {
      name: s("Image alt texts", "Alt-Texte der Bilder"),
      finding:
        page.imagesTotal === 0
          ? s("No images in the HTML.", "Keine Bilder im HTML.")
          : page.imagesMissingAlt === 0
            ? s(
                `All ${n(page.imagesTotal)} images have an alt attribute.`,
                `Alle ${n(page.imagesTotal)} Bilder haben ein Alt-Attribut.`,
              )
            : s(
                `${n(page.imagesMissingAlt)} of ${n(page.imagesTotal)} images have no alt attribute.`,
                `${n(page.imagesMissingAlt)} von ${n(page.imagesTotal)} Bildern fehlt das Alt-Attribut.`,
              ),
      status:
        page.imagesMissingAlt === 0
          ? "good"
          : missingAltShare > 0.5
            ? "fix"
            : "improve",
    },
    {
      name: s("Placeholder text", "Blindtext"),
      finding: page.hasPlaceholderText
        ? s(
            "“Lorem ipsum” found on the page.",
            "„Lorem ipsum“ auf der Seite gefunden.",
          )
        : s("None found.", "Keiner gefunden."),
      status: page.hasPlaceholderText ? "fix" : "good",
    },
    {
      name: s("Social media preview", "Vorschau in sozialen Medien"),
      finding:
        page.ogTitle && page.ogImage
          ? s(
              "og:title and og:image are set.",
              "og:title und og:image sind gesetzt.",
            )
          : s(
              `Missing: ${[page.ogTitle ? null : "og:title", page.ogImage ? null : "og:image"].filter(Boolean).join(", ")}.`,
              `Fehlt: ${[page.ogTitle ? null : "og:title", page.ogImage ? null : "og:image"].filter(Boolean).join(", ")}.`,
            ),
      status: page.ogTitle && page.ogImage ? "good" : "improve",
    },
    {
      name: s("Structured data", "Strukturierte Daten"),
      finding: page.hasStructuredData
        ? s("JSON-LD found.", "JSON-LD vorhanden.")
        : s(
            "None found. Schema markup helps search engines and AI assistants identify the business.",
            "Keine gefunden. Schema-Markup hilft Suchmaschinen und KI-Assistenten, das Unternehmen einzuordnen.",
          ),
      status: page.hasStructuredData ? "good" : "improve",
    },
    {
      name: s("Home screen icon", "Homescreen-Icon"),
      finding: page.hasAppleTouchIcon
        ? s("Apple touch icon set.", "Apple-Touch-Icon gesetzt.")
        : s(
            "No apple-touch-icon, so a saved bookmark shows a screenshot.",
            "Kein Apple-Touch-Icon. Ein gespeichertes Lesezeichen zeigt dann einen Screenshot.",
          ),
      status: page.hasAppleTouchIcon ? "good" : "improve",
    },
    {
      name: s("Frames", "Frames"),
      finding:
        page.iframeCount === 0
          ? s("None.", "Keine.")
          : s(
              `${n(page.iframeCount)} embedded, e.g. maps or videos. Their content does not count as this page's content.`,
              `${n(page.iframeCount)} eingebettet, etwa Karten oder Videos. Deren Inhalt zählt nicht als Inhalt dieser Seite.`,
            ),
      status: "note",
    },
  ]);
}

function resolve(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function stripSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
