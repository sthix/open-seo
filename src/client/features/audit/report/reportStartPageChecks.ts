import {
  area,
  metaChecks,
  qualityChecks,
  type CheckArea,
  type StartPage,
  type Words,
} from "@/client/features/audit/report/reportStartPage";
import type { ReportLanguage } from "@/client/features/audit/report/reportStrings";

const KB = 1024;

function structureChecks({ page, s, n }: Words): CheckArea {
  const h1Count = page.headings.filter((heading) => heading.level === 1).length;
  const emptyHeadings = page.headings.filter((heading) => !heading.text).length;
  const levels = page.headings.map((heading) => heading.level);
  const skips = levels.some(
    (level, index) => index > 0 && level > levels[index - 1] + 1,
  );

  return area("structure", s("Page structure", "Seitenstruktur"), [
    {
      name: s("Main heading (H1)", "Hauptüberschrift (H1)"),
      finding:
        h1Count === 0
          ? s("Missing.", "Fehlt.")
          : h1Count > 1
            ? s(
                `${n(h1Count)} H1 headings; one is enough.`,
                `${n(h1Count)} H1-Überschriften; eine genügt.`,
              )
            : s(
                `“${page.headings.find((heading) => heading.level === 1)?.text ?? ""}”`,
                `„${page.headings.find((heading) => heading.level === 1)?.text ?? ""}“`,
              ),
      status: h1Count === 0 ? "fix" : h1Count > 1 ? "improve" : "good",
    },
    {
      name: s("Heading order", "Reihenfolge der Überschriften"),
      finding: skips
        ? s(
            "Skips levels, e.g. an H4 straight after an H2.",
            "Überspringt Ebenen, etwa eine H4 direkt nach einer H2.",
          )
        : s("Descends one level at a time.", "Steigt Ebene für Ebene ab."),
      status: skips ? "improve" : "good",
    },
    {
      name: s("Empty headings", "Leere Überschriften"),
      finding:
        emptyHeadings === 0
          ? s("None.", "Keine.")
          : s(
              `${n(emptyHeadings)} heading tags without text, usually used for spacing or styling.`,
              `${n(emptyHeadings)} Überschriften-Tags ohne Text, meist für Abstände oder Gestaltung missbraucht.`,
            ),
      status: emptyHeadings === 0 ? "good" : "improve",
    },
    {
      name: s("Subheadings", "Zwischenüberschriften"),
      finding:
        page.headings.length > 1
          ? s(
              `${n(page.headings.length - h1Count)} below the H1.`,
              `${n(page.headings.length - h1Count)} unterhalb der H1.`,
            )
          : s(
              "None, so the text has no visible structure.",
              "Keine. Der Text hat damit keine erkennbare Gliederung.",
            ),
      status: page.headings.length > 1 ? "good" : "improve",
    },
  ]);
}

function linkChecks({ page, s, n }: Words): CheckArea {
  return area("links", s("Links", "Verlinkung"), [
    {
      name: s("Internal links", "Interne Links"),
      finding: s(
        `${n(page.links.internal)} links to other pages of the site.`,
        `${n(page.links.internal)} Links auf andere Seiten der Website.`,
      ),
      status: page.links.internal > 0 ? "good" : "fix",
    },
    {
      name: s("Link texts", "Linktexte"),
      finding:
        page.links.empty === 0
          ? s(
              "Every link has a text or label.",
              "Jeder Link hat einen Text oder ein Label.",
            )
          : s(
              `${n(page.links.empty)} links without any text, alt text or label.`,
              `${n(page.links.empty)} Links ohne Text, Alt-Text oder Label.`,
            ),
      status: page.links.empty === 0 ? "good" : "improve",
    },
    {
      name: s("External links", "Externe Links"),
      finding: s(
        `${n(page.links.external)} links to other sites.`,
        `${n(page.links.external)} Links auf andere Websites.`,
      ),
      status: "note",
    },
    {
      name: s("Nofollow links", "Nofollow-Links"),
      finding:
        page.links.nofollow === 0
          ? s("None.", "Keine.")
          : s(
              `${n(page.links.nofollow)} links marked nofollow.`,
              `${n(page.links.nofollow)} Links mit nofollow.`,
            ),
      status: "note",
    },
    {
      name: s("Links with parameters", "Links mit Parametern"),
      finding:
        page.links.withParameters === 0
          ? s(
              "No internal link carries URL parameters.",
              "Kein interner Link enthält URL-Parameter.",
            )
          : s(
              `${n(page.links.withParameters)} internal links carry URL parameters, which can create duplicate URLs.`,
              `${n(page.links.withParameters)} interne Links enthalten URL-Parameter, die doppelte URLs erzeugen können.`,
            ),
      status: page.links.withParameters === 0 ? "good" : "improve",
    },
  ]);
}

function serverChecks({ page, s, n }: Words): CheckArea {
  const htmlKb = Math.round(page.htmlBytes / KB);
  return area("server", s("Server configuration", "Server-Konfiguration"), [
    {
      name: s("HTTPS", "HTTPS"),
      finding: page.https
        ? s(
            "The page is served over HTTPS.",
            "Die Seite wird über HTTPS ausgeliefert.",
          )
        : s(
            "The page is served without encryption.",
            "Die Seite wird unverschlüsselt ausgeliefert.",
          ),
      status: page.https ? "good" : "fix",
    },
    {
      name: s("Redirect from http://", "Weiterleitung von http://"),
      finding:
        page.httpRedirectsToHttps === null
          ? s(
              "The http:// address does not answer.",
              "Die http://-Adresse antwortet nicht.",
            )
          : page.httpRedirectsToHttps
            ? s("Redirects to HTTPS.", "Leitet auf HTTPS weiter.")
            : s(
                "Does not redirect to HTTPS, so the site exists twice.",
                "Leitet nicht auf HTTPS weiter. Die Website existiert damit doppelt.",
              ),
      status:
        page.httpRedirectsToHttps === null
          ? "note"
          : page.httpRedirectsToHttps
            ? "good"
            : "fix",
    },
    {
      name: s("www and non-www", "Mit und ohne www"),
      finding:
        page.hostVariantConsolidated === null
          ? s(
              "Only one of the two addresses answers.",
              "Nur eine der beiden Adressen antwortet.",
            )
          : page.hostVariantConsolidated
            ? s(
                "Both lead to the same address.",
                "Beide führen auf dieselbe Adresse.",
              )
            : s(
                "Both answer without redirecting to each other, so every page exists twice.",
                "Beide antworten, ohne aufeinander weiterzuleiten. Jede Seite existiert damit doppelt.",
              ),
      status:
        page.hostVariantConsolidated === null
          ? "note"
          : page.hostVariantConsolidated
            ? "good"
            : "fix",
    },
    {
      name: s("Compression", "Komprimierung"),
      finding: page.compression
        ? s(`On (${page.compression}).`, `Aktiv (${page.compression}).`)
        : s(
            "Off. Compressing HTML usually cuts its size by 70 percent or more.",
            "Inaktiv. Komprimiertes HTML ist meist um 70 Prozent oder mehr kleiner.",
          ),
      status: page.compression ? "good" : "improve",
    },
    {
      name: s("Response time", "Antwortzeit"),
      finding: s(
        `${n(page.responseTimeMs)} ms until the HTML was received, measured once from our server.`,
        `${n(page.responseTimeMs)} ms bis zum Empfang des HTML, einmal von unserem Server gemessen.`,
      ),
      status:
        page.responseTimeMs < 800
          ? "good"
          : page.responseTimeMs < 1500
            ? "improve"
            : "fix",
    },
    {
      name: s("HTML size", "HTML-Größe"),
      finding: s(`${n(htmlKb)} KB.`, `${n(htmlKb)} KB.`),
      status: htmlKb <= 500 ? "good" : "improve",
    },
    {
      name: s("Software disclosure", "Offengelegte Software"),
      finding: page.poweredBy
        ? s(
            `The X-Powered-By header names “${page.poweredBy}”, which helps attackers target known flaws.`,
            `Der X-Powered-By-Header nennt „${page.poweredBy}“. Das erleichtert Angriffe auf bekannte Schwachstellen.`,
          )
        : s("No X-Powered-By header.", "Kein X-Powered-By-Header."),
      status: page.poweredBy ? "improve" : "good",
    },
    {
      name: s("HSTS", "HSTS"),
      finding: page.hsts
        ? s(
            "Browsers are told to always use HTTPS.",
            "Browser werden angewiesen, immer HTTPS zu verwenden.",
          )
        : s(
            "No Strict-Transport-Security header.",
            "Kein Strict-Transport-Security-Header.",
          ),
      status: page.hsts ? "good" : page.https ? "improve" : "note",
    },
    {
      name: "robots.txt",
      finding:
        page.hasRobotsTxt === null
          ? s("Could not be read.", "Konnte nicht gelesen werden.")
          : page.hasRobotsTxt
            ? s("Present.", "Vorhanden.")
            : s("Missing.", "Fehlt."),
      status:
        page.hasRobotsTxt === null
          ? "note"
          : page.hasRobotsTxt
            ? "good"
            : "improve",
    },
    {
      name: s("XML sitemap", "XML-Sitemap"),
      finding:
        page.hasSitemap === null
          ? s("Could not be checked.", "Konnte nicht geprüft werden.")
          : page.hasSitemap
            ? s(
                "Found (in robots.txt or at /sitemap.xml).",
                "Gefunden (in der robots.txt oder unter /sitemap.xml).",
              )
            : s(
                "Neither listed in robots.txt nor at /sitemap.xml.",
                "Weder in der robots.txt angegeben noch unter /sitemap.xml.",
              ),
      status:
        page.hasSitemap === null
          ? "note"
          : page.hasSitemap
            ? "good"
            : "improve",
    },
  ]);
}

/** The start page's checks in five areas, worded in the report's language. */
export function buildStartPageAreas(
  page: StartPage,
  language: ReportLanguage,
): CheckArea[] {
  const de = language === "de";
  const words: Words = {
    page,
    s: (en, german) => (de ? german : en),
    n: (value) => value.toLocaleString(de ? "de-DE" : "en-GB"),
  };
  return [
    metaChecks(words),
    qualityChecks(words),
    structureChecks(words),
    linkChecks(words),
    serverChecks(words),
  ];
}
