import type { AuditIssueType } from "@/shared/audit-issues";

interface IssueText {
  title: string;
  explanation: string;
  howToFix: string;
}

/**
 * German wording for every audit issue type, used by the PDF report. Keyed by
 * AuditIssueType, so adding an issue type to the registry fails the type check
 * until it has a German text here.
 */
export const ISSUE_TEXT_DE: Record<AuditIssueType, IssueText> = {
  "blocked-page": {
    title: "Crawler wurde blockiert",
    explanation:
      "Die Website hat statt der Seite eine Bot-Abfrage oder eine Zugriffsverweigerung ausgeliefert (zum Beispiel eine Cloudflare-Challenge oder einen 403-Status). Die Seite konnte deshalb nicht geprüft werden. Andere Crawler, etwa die von Suchmaschinen, stoßen möglicherweise auf ähnliche Hürden.",
    howToFix:
      "Geben Sie unseren Audit-Crawler in den WAF- bzw. Bot-Schutz-Einstellungen frei (bei Cloudflare: eine benutzerdefinierte WAF-Regel, die den Bot-Schutz für den User-Agent des Crawlers überspringt) und lassen Sie das Audit danach wiederholen. Bei Shopify erteilen Sie stattdessen den Crawler-Zugriff (Onlineshop › Einstellungen › Crawler-Zugriff). Den User-Agent des Crawlers nennen wir Ihnen auf Anfrage.",
  },
  "javascript-rendering-suspected": {
    title: "Inhalte benötigen möglicherweise JavaScript",
    explanation:
      "Das HTML der Seite enthält einen JavaScript-App-Container mit sehr wenig lesbarem Inhalt und ohne Überschriften, Links oder Bilder. Die Seite lädt ihre Inhalte vermutlich erst im Browser oder war beim Rendern noch nicht fertig geladen. Die Inhaltsprüfungen wurden übersprungen, weil dieses HTML die Seite womöglich nicht vollständig abbildet.",
    howToFix:
      "Wurde dieses Audit ohne JavaScript-Rendering durchgeführt, starten Sie ein neues Audit mit aktivierter Option „Render JavaScript“. Für zuverlässiges Crawling sollten wichtige Inhalte und die Navigation bereits im ausgelieferten HTML stehen, per Server-Side-Rendering oder Prerendering. Dieser Hinweis beweist nicht, dass Suchmaschinen die Seite nicht indexieren können.",
  },
  "rate-limited-page": {
    title: "Anfragelimit erreicht (429)",
    explanation:
      "Der Server hat mit 429 Too Many Requests geantwortet, die Seite konnte daher nicht geprüft werden. Der Crawler hat die vom Server genannte Wartezeit (Retry-After) eingehalten und die Seite ein weiteres Mal abgerufen, bevor er fortgefahren ist.",
    howToFix:
      "Erhöhen Sie das Anfragelimit für Crawler oder nehmen Sie den User-Agent unseres Audit-Crawlers von der Ratenbegrenzung aus und lassen Sie das Audit danach wiederholen. Bei einem strengen Limit hilft auch ein Audit mit weniger Seiten. Bei Shopify erteilen Sie stattdessen den Crawler-Zugriff (Onlineshop › Einstellungen › Crawler-Zugriff).",
  },
  "crawl-rate-limited": {
    title: "Crawl vorzeitig beendet: Anfragelimit",
    explanation:
      "Die Website hat mehrere Seiten in Folge mit 429 Too Many Requests abgelehnt oder den Crawler zu lange warten lassen. Der Crawl wurde deshalb abgebrochen. Dieser Bericht ist unvollständig; nicht abgerufene URLs sind weder als fehlerhaft noch als limitiert erfasst.",
    howToFix:
      "Lassen Sie das Audit wiederholen, sobald das Anfragelimit der Website zurückgesetzt ist, oder nehmen Sie unseren Audit-Crawler von der Ratenbegrenzung aus. Bei Shopify erteilen Sie stattdessen den Crawler-Zugriff (Onlineshop › Einstellungen › Crawler-Zugriff).",
  },
  "server-error": {
    title: "Serverfehler (5xx)",
    explanation:
      "Die Seite hat einen 5xx-Serverfehler zurückgegeben. Suchmaschinen, die wiederholt auf Serverfehler stoßen, crawlen die Website seltener und entfernen die Seite unter Umständen aus dem Index.",
    howToFix:
      "Prüfen Sie die Server-Logs zu dieser URL und beheben Sie die Ursache. Existiert die Seite nicht mehr, liefern Sie einen 404- oder 410-Status aus oder leiten Sie auf eine passende Seite weiter.",
  },
  "broken-internal-link": {
    title: "Defekter interner Link",
    explanation:
      "Diese Seite verlinkt auf eine interne URL, die einen Fehlerstatus (4xx/5xx) zurückgibt. Defekte Links verschwenden Crawl-Budget, lassen Linkkraft verpuffen und frustrieren Besucher. Sie gehören zu den häufigsten und schädlichsten technischen SEO-Problemen.",
    howToFix:
      "Korrigieren Sie den Link auf die richtige, erreichbare URL oder entfernen Sie ihn. Wurde das Ziel verschoben, verlinken Sie direkt auf die neue URL, statt sich auf eine Weiterleitung zu verlassen.",
  },
  "missing-title": {
    title: "Title-Tag fehlt",
    explanation:
      "Die Seite hat kein <title>-Element. Der Title ist das stärkste Relevanzsignal auf der Seite und die Überschrift in den Suchergebnissen. Fehlt er, erzeugen Suchmaschinen selbst einen, meist einen schlechten.",
    howToFix:
      "Ergänzen Sie einen eindeutigen, aussagekräftigen Title mit etwa 50–60 Zeichen, der das Hauptthema der Seite nennt.",
  },
  "broken-page": {
    title: "Seite liefert einen Fehler (4xx)",
    explanation:
      "Diese gecrawlte URL hat einen Client-Fehler zurückgegeben (zum Beispiel 404). Wird sie in der Sitemap oder auf anderen Seiten referenziert, verschwenden Crawler weiterhin Anfragen darauf.",
    howToFix:
      "Soll die Seite existieren, stellen Sie sie wieder her. Wurde sie bewusst entfernt, nehmen Sie sie aus der Sitemap und den internen Links und prüfen Sie eine 301-Weiterleitung auf die am besten passende erreichbare Seite.",
  },
  "duplicate-title": {
    title: "Doppelter Title",
    explanation:
      "Mehrere Seiten haben denselben Title. Suchmaschinen unterscheiden Seiten anhand ihrer Titles; Duplikate lassen Seiten gegeneinander konkurrieren und senken die Klickrate.",
    howToFix:
      "Formulieren Sie für jede Seite einen eigenen Title, der ihren konkreten Inhalt beschreibt. Bei Template-Seiten nehmen Sie das unterscheidende Merkmal (Name, Kategorie, Standort) in das Template auf.",
  },
  "duplicate-meta-description": {
    title: "Doppelte Meta-Description",
    explanation:
      "Mehrere Seiten haben dieselbe Meta-Description. In den Suchergebnissen erscheinen dadurch identische Snippets, und Nutzer können die Seiten nicht auseinanderhalten.",
    howToFix:
      "Schreiben Sie pro Seite eine eigene Meta-Description oder entfernen Sie die doppelte ganz. Suchmaschinen erzeugen dann ein Snippet aus dem Seiteninhalt, was besser ist als ein unpassendes Duplikat.",
  },
  "duplicate-content": {
    title: "Doppelter Seiteninhalt",
    explanation:
      "Zwei oder mehr URLs liefern exakt denselben sichtbaren Text aus. Suchmaschinen wählen eine Version für den Index und ignorieren die übrigen; Rankingsignale verteilen sich auf die Duplikate.",
    howToFix:
      "Führen Sie die Duplikate zusammen: Legen Sie die kanonische URL fest, setzen Sie auf den anderen rel=canonical und leiten Sie doppelte URLs nach Möglichkeit per 301 weiter. Häufige Ursachen sind Varianten mit und ohne Schrägstrich am Ende, URL-Parameter sowie http/https- oder www-Varianten.",
  },
  "missing-meta-description": {
    title: "Meta-Description fehlt",
    explanation:
      "Die Seite hat keine Meta-Description. Suchmaschinen stellen dann ein Snippet aus dem Seitentext zusammen, das oft weniger überzeugt und die Klickrate senkt.",
    howToFix:
      "Ergänzen Sie eine Meta-Description mit etwa 70–160 Zeichen, die die Seite zusammenfasst und einen Grund zum Klicken liefert.",
  },
  "missing-h1": {
    title: "H1-Überschrift fehlt",
    explanation:
      "Die Seite hat keine H1. Die H1 zeigt Nutzern und Suchmaschinen, worum es auf der Seite geht; ohne sie ist das Thema der Seite weniger klar erkennbar.",
    howToFix:
      "Ergänzen Sie genau eine H1, die das Hauptthema der Seite benennt und zum Title passt.",
  },
  "multiple-h1": {
    title: "Mehrere H1-Überschriften",
    explanation:
      "Die Seite hat mehr als eine H1. Das verwässert das Signal für das Hauptthema und deutet meist auf einen Template-Fehler hin, etwa wenn Logo und Überschrift beide als H1 ausgezeichnet sind.",
    howToFix:
      "Behalten Sie eine H1 für die Hauptüberschrift und stufen Sie die übrigen zu H2/H3 herab. Elemente, die keine Überschriften sind (zum Beispiel Logos), sollten gar nicht als Überschrift ausgezeichnet sein.",
  },
  "redirect-chain": {
    title: "Weiterleitungskette",
    explanation:
      "Bis zur Zielseite sind zwei oder mehr aufeinanderfolgende Weiterleitungen nötig. Jeder Schritt kostet Ladezeit, Linkkraft und Crawl-Budget; lange Ketten werden unter Umständen gar nicht verfolgt.",
    howToFix:
      "Lassen Sie die erste URL und alle internen Links direkt auf das endgültige Ziel zeigen, sodass höchstens eine Weiterleitung übrig bleibt.",
  },
  "redirect-loop": {
    title: "Weiterleitungsschleife",
    explanation:
      "Diese Weiterleitung führt am Ende wieder zu sich selbst, die URL wird also nie aufgelöst. Browser und Crawler brechen mit einem Fehler ab.",
    howToFix:
      "Verfolgen Sie die Weiterleitungsregeln für diese URL und lösen Sie den Kreis auf, sodass die Kette auf einer echten Seite mit Status 200 endet.",
  },
  "canonical-conflict": {
    title: "Widersprüchliche Canonical-Angaben",
    explanation:
      "Die Seite nennt im HTML (<link rel=canonical>) und im HTTP-Link-Header unterschiedliche kanonische URLs. Bei widersprüchlichen Signalen ignorieren Suchmaschinen beide und wählen selbst eine kanonische URL.",
    howToFix:
      "Entscheiden Sie sich für eine kanonische URL und geben Sie sie an genau einer Stelle an (üblich ist der HTML-Head). Entfernen Sie die andere Angabe oder gleichen Sie sie an.",
  },
  "thin-content": {
    title: "Wenig Inhalt",
    explanation:
      "Die Seite enthält sehr wenig sichtbaren Text. Solche Seiten ranken selten, können die Qualitätsbewertung der gesamten Website belasten und deuten bei clientseitig gerenderten Websites darauf hin, dass Inhalte für reine HTML-Crawler unsichtbar sind.",
    howToFix:
      "Erweitern Sie die Seite um wirklich nützliche Inhalte, setzen Sie sie auf noindex oder führen Sie sie mit einer stärkeren Seite zusammen. Ist der Inhalt vorhanden, wird aber per JavaScript gerendert, stellen Sie Server-Side-Rendering oder Prerendering sicher.",
  },
  "images-missing-alt": {
    title: "Bilder ohne Alt-Text",
    explanation:
      "Einem oder mehreren Bildern der Seite fehlt das alt-Attribut. Alt-Texte sind eine Anforderung der Barrierefreiheit und der wichtigste Weg, auf dem Suchmaschinen Bilder verstehen.",
    howToFix:
      'Geben Sie aussagekräftigen Bildern einen beschreibenden Alt-Text. Ein leeres alt-Attribut (alt="") ist nur für rein dekorative Bilder gedacht.',
  },
  "orphan-page": {
    title: "Verwaiste Seite",
    explanation:
      "Keine gecrawlte Seite verlinkt auf diese URL; sie war nur über die Sitemap auffindbar. Seiten ohne interne Links werden selten gecrawlt, erhalten keine interne Linkkraft und sind für Besucher über die Navigation nicht erreichbar.",
    howToFix:
      "Verlinken Sie die Seite von thematisch passenden Seiten aus (Navigation, verwandte Inhalte, Übersichtsseiten) oder entfernen Sie sie aus der Sitemap, wenn sie nicht indexiert werden soll.",
  },
  "no-outgoing-links": {
    title: "Seite ohne ausgehende Links",
    explanation:
      "Die Seite enthält überhaupt keine Links und ist damit eine Sackgasse. Eingehende Linkkraft endet hier, Crawler kommen nicht weiter, und Besucher müssen zurück navigieren.",
    howToFix:
      "Ergänzen Sie Links zu verwandten Seiten, zur übergeordneten Kategorie oder zur Startseite. Wird die Navigation per JavaScript gerendert, sollte sie auch im serverseitig ausgelieferten HTML vorhanden sein.",
  },
  "title-too-long": {
    title: "Title zu lang",
    explanation:
      "Der Title hat mehr als etwa 60 Zeichen. Suchergebnisse kürzen ihn, und das Ende wird womöglich mitten im Satz abgeschnitten.",
    howToFix:
      "Kürzen Sie den Title auf etwa 50–60 Zeichen und stellen Sie die wichtigsten Wörter an den Anfang.",
  },
  "title-too-short": {
    title: "Title zu kurz",
    explanation:
      "Der Title hat weniger als etwa 10 Zeichen. Das ist meist zu allgemein, um die Seite zu beschreiben oder zum Klicken anzuregen.",
    howToFix:
      "Erweitern Sie den Title zu einer aussagekräftigen Formulierung (etwa 30–60 Zeichen), die sagt, was die Seite bietet.",
  },
  "meta-description-too-long": {
    title: "Meta-Description zu lang",
    explanation:
      "Die Meta-Description hat mehr als etwa 160 Zeichen und wird von Suchmaschinen im Snippet gekürzt.",
    howToFix:
      "Kürzen Sie die Beschreibung auf etwa 70–160 Zeichen und behalten Sie Kernaussage und Handlungsaufforderung bei.",
  },
  "meta-description-too-short": {
    title: "Meta-Description zu kurz",
    explanation:
      "Die Meta-Description hat weniger als etwa 70 Zeichen. Kurze Beschreibungen verschenken den Platz im Snippet, und Suchmaschinen ersetzen sie oft durch Text aus der Seite.",
    howToFix:
      "Erweitern Sie die Beschreibung auf etwa 70–160 Zeichen, die die Seite zusammenfassen und einen Grund zum Klicken liefern.",
  },
  "heading-order-skip": {
    title: "Überschriftenebenen übersprungen",
    explanation:
      "Die Überschriftenhierarchie überspringt Ebenen, zum Beispiel folgt eine H4 direkt auf eine H2. Das schwächt die Dokumentstruktur für Hilfstechnologien und für die maschinelle Auswertung der Inhalte.",
    howToFix:
      "Passen Sie die Ebenen so an, dass sie schrittweise absteigen (H1 › H2 › H3), ohne eine Ebene auszulassen.",
  },
  "slow-response": {
    title: "Langsame Serverantwort",
    explanation:
      "Die HTML-Antwort hat länger als 1,5 Sekunden gedauert. Eine langsame Time to First Byte verschlechtert alle nachgelagerten Performance-Werte und senkt bei großen Websites die Crawl-Rate.",
    howToFix:
      "Untersuchen Sie Server- und Datenbankzeiten sowie das Caching für diese Route. Gecachtes oder statisch generiertes HTML behebt das Problem in der Regel.",
  },
  "noindex-page": {
    title: "Seite steht auf noindex",
    explanation:
      "Die Seite weist Suchmaschinen an, sie nicht zu indexieren (per Robots-Meta-Tag oder X-Robots-Tag-Header). Das ist oft beabsichtigt und daher ein Hinweis, kein Fehler.",
    howToFix:
      "Soll die Seite ranken, entfernen Sie die noindex-Anweisung. Ist sie beabsichtigt (Admin-, Danke- oder Filterseiten), besteht kein Handlungsbedarf.",
  },
  "canonicalized-page": {
    title: "Canonical verweist auf eine andere URL",
    explanation:
      "Die Seite nennt eine andere URL als kanonisch und weist Suchmaschinen damit an, jene URL zu indexieren. Das ist in Ordnung, wenn es beabsichtigt ist (Parameterseiten, Syndizierung), aber ein Problem, wenn diese Seite selbst ranken soll.",
    howToFix:
      "Soll diese Seite eigenständig ranken, setzen Sie den Canonical auf die Seite selbst. Andernfalls besteht kein Handlungsbedarf.",
  },
  "deep-page": {
    title: "Seite liegt tief in der Seitenstruktur",
    explanation:
      "Die Seite ist fünf oder mehr Klicks von der Startseite entfernt. Tief liegende Seiten werden seltener gecrawlt und erhalten weniger Linkkraft.",
    howToFix:
      "Verlinken Sie die Seite von höheren Ebenen aus (Übersichts- und Kategorieseiten, Navigation), um den Weg dorthin zu verkürzen.",
  },
};
