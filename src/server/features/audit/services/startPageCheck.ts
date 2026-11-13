import { sortBy } from "remeda";
import { readTextUpTo, MAX_HTML_BYTES } from "@/server/lib/audit/html-response";
import {
  fetchFollowingRedirects,
  fetchSiteTextFile,
} from "@/server/lib/audit/discovery";
import { isCrawlableUrl } from "@/server/lib/audit/url-policy";

const PAGE_TIMEOUT_MS = 15_000;
const VARIANT_TIMEOUT_MS = 8_000;
const TOP_KEYWORDS = 8;
const MAX_KEYWORD_TEXT_CHARS = 200_000;

/**
 * Words that say nothing about a page's topic, in the two languages the
 * report is written in. Kept short: the top terms only need the obvious
 * function words removed.
 */
const STOP_WORDS = new Set(
  `a about after all also an and any are as at be because been but by can could
  do does for from had has have how if in into is it its just more most no not
  of on one only or other our out over so some such than that the their them
  then there these they this to up us was we were what when which who will with
  you your yours here more new now get all
  aber alle allem allen aller alles als also am an ans auch auf aus bei beim
  bin bis bist da dadurch daher damit dann das dass dem den denn der des dessen
  die dies diese diesem diesen dieser dieses doch dort du durch ein eine einem
  einen einer eines er es etwa euch euer für gegen hat hatte haben hier hin
  ich ihr ihre ihrem ihren ihrer im in ins ist ja jede jedem jeden jeder jedes
  jetzt kann kein keine können man mehr mein mit muss nach nicht noch nun nur
  ob oder ohne sehr sein seine sich sie sind so sowie um und uns unser unsere
  unter vom von vor war waren was weil wenn wer werden wie wir wird wo zu zum
  zur zwischen über sie ihnen ihr mehr
  inkl zzgl ggf bzw usw evtl z.b ca`.split(/\s+/),
);

interface KeywordUse {
  term: string;
  count: number;
  inTitle: boolean;
  inDescription: boolean;
  inH1: boolean;
}

function contains(text: string, term: string): boolean {
  return text.toLowerCase().includes(term);
}

/** The most frequent content words and where else the page names them. */
function topKeywords(args: {
  bodyText: string;
  title: string;
  metaDescription: string;
  h1: string;
}): KeywordUse[] {
  const counts = new Map<string, number>();
  const words = args.bodyText
    .slice(0, MAX_KEYWORD_TEXT_CHARS)
    .toLowerCase()
    .match(/[\p{L}][\p{L}\p{N}-]*[\p{L}\p{N}]/gu);
  for (const word of words ?? []) {
    if (word.length < 3 || STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return sortBy(
    [...counts].filter(([, count]) => count > 1),
    [([, count]) => count, "desc"],
  )
    .slice(0, TOP_KEYWORDS)
    .map(([term, count]) => ({
      term,
      count,
      inTitle: contains(args.title, term),
      inDescription: contains(args.metaDescription, term),
      inH1: contains(args.h1, term),
    }));
}

function hostVariant(url: URL): string | null {
  const host = url.hostname;
  // An IP address or a deeper subdomain has no www counterpart to compare.
  if (/^[\d.]+$/.test(host) || host.includes(":")) return null;
  const other = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  return `${url.protocol}//${other}/`;
}

/** Where a URL ends up; null when it does not answer. */
async function finalUrlOf(url: string): Promise<string | null> {
  if (!isCrawlableUrl(url)) return null;
  try {
    const fetched = await fetchFollowingRedirects(
      url,
      VARIANT_TIMEOUT_MS,
      null,
    );
    if (!fetched) return null;
    await fetched.response.body?.cancel();
    return fetched.response.ok ? fetched.finalUrl : null;
  } catch {
    return null;
  }
}

async function exists(url: string): Promise<boolean | null> {
  const file = await fetchSiteTextFile(url);
  return file ? file.found : null;
}

/**
 * A single-page check of the audit's start URL, read when the report is made:
 * the head, the content, the links and how the server answers. Mirrors what
 * one-URL SEO checkers report, next to the crawl's site-wide findings.
 */
export async function loadStartPageCheck(startUrl: string) {
  const startedAt = Date.now();
  const fetched = await fetchFollowingRedirects(
    startUrl,
    PAGE_TIMEOUT_MS,
    null,
  );
  if (!fetched) return null;
  const { response, finalUrl } = fetched;
  const responseTimeMs = Date.now() - startedAt;
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/html")) {
    await response.body?.cancel();
    return null;
  }
  const html = await readTextUpTo(response, MAX_HTML_BYTES);
  // Loaded on demand like the crawler does, to keep the HTML parser out of
  // the worker's startup module graph.
  const { analyzeHtml } = await import("@/server/lib/audit/page-analyzer");
  const page = analyzeHtml(html, finalUrl, response.status, responseTimeMs);

  const final = new URL(finalUrl);
  const httpUrl = `http://${final.host}/`;
  const variant = hostVariant(final);
  const [httpFinal, variantFinal, robots, sitemap, faviconIco] =
    await Promise.all([
      final.protocol === "https:" ? finalUrlOf(httpUrl) : null,
      variant ? finalUrlOf(variant) : null,
      fetchSiteTextFile(`${final.origin}/robots.txt`),
      exists(`${final.origin}/sitemap.xml`),
      page.hasFavicon ? true : exists(`${final.origin}/favicon.ico`),
    ]);

  const robotsText = robots?.found ? robots.text : "";
  const headerCharset = /charset=([^;\s]+)/i.exec(contentType)?.[1] ?? null;
  const internal = page.links.filter((link) => link.isInternal);
  const h1 = page.headings.find((heading) => heading.level === 1)?.text ?? "";

  return {
    url: finalUrl,
    statusCode: response.status,
    responseTimeMs,
    /** Capped at MAX_HTML_BYTES: a larger page reads as exactly 1 MiB. */
    htmlBytes: new TextEncoder().encode(html).length,
    compression: response.headers.get("content-encoding"),
    https: final.protocol === "https:",
    /** null: the http:// address did not answer at all. */
    httpRedirectsToHttps:
      final.protocol !== "https:"
        ? false
        : httpFinal === null
          ? null
          : httpFinal.startsWith("https://"),
    /** null: the site has no www (or non-www) counterpart that answers. */
    hostVariantConsolidated:
      variantFinal === null
        ? null
        : new URL(variantFinal).hostname === final.hostname,
    poweredBy: response.headers.get("x-powered-by"),
    server: response.headers.get("server"),
    hsts: response.headers.has("strict-transport-security"),
    charset: page.charset ?? headerCharset?.toLowerCase() ?? null,
    hasDoctype: page.hasDoctype,
    title: page.title,
    metaDescription: page.metaDescription,
    canonical: page.canonical,
    robotsMeta: page.robotsMeta,
    xRobotsTag: response.headers.get("x-robots-tag"),
    lang: page.lang,
    hreflangCount: page.hreflangTags.length,
    hasFavicon: faviconIco ?? page.hasFavicon,
    hasAppleTouchIcon: page.hasAppleTouchIcon,
    hasViewport: page.hasViewport,
    ogTitle: page.ogTitle,
    ogImage: page.ogImage,
    hasStructuredData: page.hasStructuredData,
    wordCount: page.wordCount,
    hasPlaceholderText: page.hasPlaceholderText,
    iframeCount: page.iframeCount,
    headings: page.headings,
    imagesTotal: page.images.length,
    imagesMissingAlt: page.images.filter((image) => image.alt === null).length,
    links: {
      internal: internal.length,
      external: page.links.length - internal.length,
      nofollow: page.links.filter((link) => link.isNofollow).length,
      empty: page.emptyLinkCount,
      withParameters: internal.filter((link) => link.targetUrl.includes("?"))
        .length,
    },
    keywords: topKeywords({
      bodyText: page.bodyText,
      title: page.title,
      metaDescription: page.metaDescription,
      h1,
    }),
    /** null: robots.txt could not be read (refused or unreachable). */
    hasRobotsTxt: robots ? robots.found : null,
    hasSitemap:
      /^\s*sitemap\s*:/im.test(robotsText) || sitemap === true ? true : sitemap,
  };
}
