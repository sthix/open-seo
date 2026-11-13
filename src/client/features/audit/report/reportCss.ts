/** Quotes text for a CSS `content` string inside a <style> element. */
function cssString(text: string): string {
  return `"${text.replace(/[\\"<>\n]/g, (char) => `\\${char.charCodeAt(0).toString(16)} `)}"`;
}

// Chrome prints its own date, title and URL around the page unless the page
// fills those margin boxes itself, so the unused ones are set to empty strings.
export function reportCss({
  fonts,
  footer,
  pageOf,
}: {
  fonts: { latin: string; latinExt: string };
  footer: string;
  pageOf: string;
}): string {
  return `
@font-face{font-family:"Inter Report";font-style:normal;font-weight:100 900;font-display:block;src:url(${cssString(fonts.latinExt)}) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter Report";font-style:normal;font-weight:100 900;font-display:block;src:url(${cssString(fonts.latin)}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}

@page{size:A4;margin:18mm 16mm 20mm;
  @top-left{content:""}@top-center{content:""}@top-right{content:""}@bottom-center{content:""}
  @bottom-left{content:${cssString(footer)};font:500 7.5pt "Inter Report",system-ui,sans-serif;color:#8B8B97}
  @bottom-right{content:counter(page) " ${pageOf} " counter(pages);font:500 7.5pt "Inter Report",system-ui,sans-serif;color:#8B8B97}
}
@page :first{@bottom-left{content:""}@bottom-right{content:""}}

:root{--ink:#1C1C1F;--muted:#5F5F66;--faint:#8A8A92;--rule:#DEDEE2;--wash:#F6F6F4}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font:400 9.5pt/1.55 "Inter Report",system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);font-feature-settings:"cv11";-webkit-font-smoothing:antialiased}
h1,h2,h3,h4,p,ul,ol{margin:0}
ul,ol{padding:0;list-style:none}

.label{font-size:8.5pt;color:var(--muted)}
.dot{display:inline-block;width:2mm;height:2mm;border-radius:50%;margin-right:1.6mm;vertical-align:.02em}
.muted{color:var(--faint)}
.strong{font-weight:600}
.count{font-weight:600;margin-left:1.6mm}

.cover{height:258mm;padding:4mm 0 0;display:flex;flex-direction:column;justify-content:space-between}
.cover-top{display:flex;justify-content:space-between;font-size:9pt;color:var(--muted);padding-bottom:3mm;border-bottom:.25mm solid var(--ink)}
.cover-main{margin-bottom:24mm}
.cover h1{font-size:34pt;font-weight:600;line-height:1.1;letter-spacing:-.02em;overflow-wrap:anywhere}
.cover h1.long{font-size:24pt}
.cover-sub{margin-top:4mm;font-size:10.5pt;color:var(--muted);overflow-wrap:anywhere}
.cover-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:6mm;border-top:.25mm solid var(--rule);padding-top:5mm}
.cover-value{font-size:16pt;font-weight:600;line-height:1.2;margin-bottom:.8mm}

.bar{display:flex;gap:.5mm;height:2.4mm}
.bar span{min-width:1.2mm}

.section{break-before:page}
.section-head{break-after:avoid;break-inside:avoid;margin-bottom:6mm;padding-bottom:3mm;border-bottom:.25mm solid var(--rule)}
.section-head h2{font-size:17pt;font-weight:600;letter-spacing:-.015em;line-height:1.2}
.section-head p{color:var(--muted);margin-top:1.5mm;max-width:140mm}

.lead{font-size:11pt;line-height:1.5;max-width:150mm}
.note{margin-top:4mm;padding:3mm 4mm;background:#FAF4E6;break-inside:avoid}
.tiles{display:grid;grid-template-columns:1fr 1fr;column-gap:10mm;margin-top:7mm;border-top:.25mm solid var(--ink)}
.tiles.five{margin-top:0}
.tile{display:flex;flex-direction:row-reverse;justify-content:space-between;align-items:baseline;gap:4mm;padding:2.2mm 0;border-bottom:.2mm solid var(--rule)}
.tile .label{font-size:9.5pt;color:var(--ink)}
.tile-value{font-size:10.5pt;font-weight:600;white-space:nowrap}

.block{margin-top:9mm;break-inside:avoid}
.block>h3{font-size:10.5pt;font-weight:600;margin-bottom:3mm}
.h3-aside{float:right;font-weight:500;color:var(--muted)}
.block-intro{color:var(--muted);font-size:8.8pt;margin:-1.5mm 0 3.5mm;max-width:140mm}
.block-table{margin-top:6mm}
.top-pages{margin:0 0 10mm}
.legend{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:3.5mm}
.legend p{color:var(--muted);font-size:8.5pt;line-height:1.4;margin-top:.8mm}
.inline-legend{display:flex;flex-wrap:wrap;gap:1.5mm 7mm;margin-top:3mm}
.caption{color:var(--muted);font-size:8.5pt;margin-top:3mm}

table{width:100%;border-collapse:collapse;font-size:8.8pt;line-height:1.4}
th{font-size:8.5pt;font-weight:600;color:var(--ink);text-align:left;padding:0 2mm 1.8mm;border-bottom:.25mm solid var(--ink);white-space:nowrap}
td{padding:1.8mm 2mm;border-bottom:.2mm solid var(--rule);vertical-align:top}
tr{break-inside:avoid}
th:first-child,td:first-child{padding-left:0}
th:last-child,td:last-child{padding-right:0}
.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.tile-value,.cover-value{font-variant-numeric:tabular-nums}
table.keywords td:first-child{width:40%}
td.url{width:34%;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:7.8pt;overflow-wrap:anywhere}
.severity{font-size:8.5pt;font-weight:600;white-space:nowrap}
table.checks td:first-child{width:30%}
table.checks td{overflow-wrap:anywhere}

.finding{break-inside:avoid;padding-top:4mm;margin-bottom:6mm;border-top:.2mm solid var(--rule)}
.finding:first-of-type{border-top:0;padding-top:0}
.finding header{display:flex;justify-content:space-between;align-items:baseline;gap:4mm;margin-bottom:2.5mm}
.finding h3{font-size:11.5pt;font-weight:600;line-height:1.3}
.finding h3 .muted{font-weight:500;margin-right:2.5mm}
.finding h4{font-size:9pt;font-weight:600;margin-bottom:1mm}
.finding-text{display:grid;grid-template-columns:1fr 1fr;gap:7mm;margin-bottom:3.5mm}
.finding-text p{font-size:9pt;line-height:1.55;overflow-wrap:anywhere}
.urls{display:grid;grid-template-columns:1fr 1fr;column-gap:7mm;font:7.8pt/1.5 ui-monospace,"SF Mono",Menlo,Consolas,monospace}
.urls li{display:flex;justify-content:space-between;gap:3mm;overflow-wrap:anywhere;padding:.5mm 0;border-bottom:.2mm solid var(--rule)}
.urls .more{font-family:"Inter Report",system-ui,sans-serif;color:var(--muted);border:0}

.url-traffic{font-family:"Inter Report",system-ui,sans-serif;color:var(--muted);white-space:nowrap}

.check{break-inside:avoid;padding-top:4mm;margin-bottom:6mm;border-top:.2mm solid var(--rule)}
.check:first-of-type{border-top:0;padding-top:0}
.check header{display:flex;justify-content:space-between;align-items:baseline;gap:4mm;margin-bottom:1.5mm}
.check h3{font-size:11.5pt;font-weight:600;line-height:1.3}
.check-value{font-size:11pt;font-weight:600;white-space:nowrap}
.check p{font-size:9pt;line-height:1.55;color:var(--muted);max-width:140mm}
.check table{margin-top:3.5mm}

.serp{max-width:150mm;padding:4mm 5mm;border:.2mm solid var(--rule);font-family:Arial,Helvetica,sans-serif}
.serp-url{font-size:8.5pt;color:#4D5156;overflow-wrap:anywhere}
.serp-title{font-size:13pt;line-height:1.3;color:#1A0DAB;margin:1mm 0 .8mm}
.serp-text{font-size:9pt;line-height:1.45;color:#4D5156}

.outline li{padding:.9mm 0;border-bottom:.2mm solid var(--rule);font-size:9pt;break-inside:avoid}
.outline .muted{display:inline-block;width:8mm;font-size:8pt}

.about{break-inside:avoid;margin-top:10mm;padding-top:4mm;border-top:.25mm solid var(--ink)}
.about h3{font-size:9.5pt;font-weight:600;margin-bottom:1.5mm}
.about p{font-size:8.8pt;color:var(--muted);overflow-wrap:anywhere}

.toolbar{display:none}
@media screen{
  html{background:#E4E4EA}
  body{padding:18mm 0 12mm}
  .toolbar{display:flex;position:fixed;inset:0 0 auto;z-index:1;align-items:center;justify-content:center;gap:5mm;padding:2.5mm 5mm;background:#fff;border-bottom:1px solid var(--rule);font-size:9pt;color:var(--muted)}
  .toolbar button{font:600 9pt "Inter Report",system-ui,sans-serif;color:#fff;background:var(--ink);border:0;border-radius:1mm;padding:2mm 4mm;cursor:pointer}
  .cover{height:297mm;padding:20mm 18mm 18mm;background:#fff}
  .section{margin-top:14mm}
  .section:first-child{margin-top:0}
  .cover,.content{width:210mm;max-width:100%;margin:0 auto 8mm;box-shadow:0 1px 2px rgba(0,0,0,.12)}
  .content{background:#fff;padding:18mm 16mm 20mm}
}
`;
}
