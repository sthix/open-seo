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

:root{--ink:#15151C;--muted:#6C6C78;--faint:#8B8B97;--rule:#E3E3EA;--wash:#F5F5F8}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font:400 9.5pt/1.5 "Inter Report",system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);font-feature-settings:"tnum","cv11","ss03";-webkit-font-smoothing:antialiased}
h1,h2,h3,h4,p,ul{margin:0}
ul{padding:0;list-style:none}

.label{font-size:7pt;font-weight:600;letter-spacing:.11em;text-transform:uppercase;color:var(--muted)}
.dot{display:inline-block;width:2.1mm;height:2.1mm;border-radius:50%;margin-right:1.6mm;vertical-align:.02em}
.muted{color:var(--faint)}
.strong{font-weight:600}
.count{font-weight:600;margin-left:1.6mm}

.cover{height:258mm;padding:16mm 16mm 14mm;background:var(--ink);color:#fff;display:flex;flex-direction:column;justify-content:space-between}
.cover .label{color:#A9A9B8}
.cover-top{display:flex;justify-content:space-between}
.cover h1{font-size:46pt;font-weight:700;line-height:1.04;letter-spacing:-.035em;overflow-wrap:anywhere;margin-bottom:11mm}
.cover h1.long{font-size:30pt}
.cover-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:6mm;border-top:.3mm solid #3A3A47;padding-top:6mm}
.cover-value{font-size:24pt;font-weight:650;letter-spacing:-.03em;line-height:1.1;margin-bottom:1.5mm}

.bar{display:flex;gap:.6mm;height:3.2mm}
.bar span{min-width:1.2mm}
.cover-bar{height:1.6mm}

.section{break-before:page}
.section-head{break-after:avoid;break-inside:avoid;margin-bottom:6mm;padding-top:3mm;border-top:.7mm solid var(--ink)}
.section-head h2{font-size:21pt;font-weight:700;letter-spacing:-.03em;line-height:1.15}
.section-head p{color:var(--muted);margin-top:1.5mm;max-width:130mm}

.lead{font-size:12pt;line-height:1.45;letter-spacing:-.01em;max-width:150mm}
.note{margin-top:4mm;padding:3mm 4mm;background:#FBF3E2;border-left:.8mm solid #D9920F;break-inside:avoid}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;margin-top:8mm}
.tiles.five{grid-template-columns:repeat(5,1fr);margin-top:0}
.tile{border-top:.3mm solid var(--ink);padding-top:2.5mm}
.tile-value{font-size:21pt;font-weight:650;letter-spacing:-.03em;line-height:1.15;margin-bottom:1mm}

.block{margin-top:9mm;break-inside:avoid}
.block>h3{font-size:10pt;font-weight:650;margin-bottom:3mm}
.block-intro{color:var(--muted);font-size:8.5pt;margin:-1.5mm 0 3.5mm;max-width:130mm}
.top-pages{margin:0 0 10mm}
.legend{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:3.5mm}
.legend p{color:var(--muted);font-size:8.5pt;line-height:1.4;margin-top:.8mm}
.inline-legend{display:flex;flex-wrap:wrap;gap:1.5mm 7mm;margin-top:3mm}
.gauges{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm}
.gauge{text-align:center}
.gauge svg{width:25mm;height:25mm;display:block;margin:0 auto 1.5mm}
.gauge text{font-size:17px;font-weight:650;letter-spacing:-.02em}
.caption{color:var(--muted);font-size:8.5pt;margin-top:4mm}

table{width:100%;border-collapse:collapse;font-size:8.5pt;line-height:1.35}
th{font-size:7pt;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);text-align:left;padding:0 2mm 2mm;border-bottom:.3mm solid var(--ink);white-space:nowrap}
td{padding:2mm;border-bottom:.2mm solid var(--rule);vertical-align:top}
tr{break-inside:avoid}
th:first-child,td:first-child{padding-left:0}
th:last-child,td:last-child{padding-right:0}
.num{text-align:right;white-space:nowrap}
td.url{width:34%;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:7.5pt;overflow-wrap:anywhere}
.severity{font-size:8pt;font-weight:600;white-space:nowrap}

.finding{break-inside:avoid;border-left:.9mm solid;padding:.5mm 0 .5mm 5mm;margin-bottom:7mm}
.finding header{display:flex;justify-content:space-between;align-items:baseline;gap:4mm;margin-bottom:3mm}
.finding h3{font-size:12.5pt;font-weight:650;letter-spacing:-.015em;line-height:1.25}
.finding h3 .muted{font-weight:500;margin-right:2.5mm}
.finding h4{font-size:7pt;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin-bottom:1.2mm}
.finding-text{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-bottom:3.5mm}
.finding-text p{font-size:8.8pt;line-height:1.5;overflow-wrap:anywhere}
.urls{display:grid;grid-template-columns:1fr 1fr;column-gap:6mm;font:7.5pt/1.5 ui-monospace,"SF Mono",Menlo,Consolas,monospace}
.urls li{display:flex;justify-content:space-between;gap:3mm;overflow-wrap:anywhere;padding:.5mm 0;border-bottom:.2mm solid var(--rule)}
.urls .more{font-family:"Inter Report",system-ui,sans-serif;color:var(--muted);border:0}

.url-traffic{font-family:"Inter Report",system-ui,sans-serif;color:var(--muted);white-space:nowrap}

.check{break-inside:avoid;border-left:.9mm solid;padding:.5mm 0 .5mm 5mm;margin-bottom:7mm}
.check header{display:flex;justify-content:space-between;align-items:baseline;gap:4mm;margin-bottom:1.5mm}
.check h3{font-size:12.5pt;font-weight:650;letter-spacing:-.015em;line-height:1.25}
.check-value{font-size:12.5pt;font-weight:650;letter-spacing:-.015em;white-space:nowrap}
.check p{font-size:8.8pt;line-height:1.5;color:var(--muted);max-width:140mm}
.check table{margin-top:3.5mm}

.about{break-inside:avoid;margin-top:9mm;background:var(--wash);padding:5mm 6mm}
.about h3{font-size:9pt;font-weight:650;margin-bottom:1.5mm}
.about p{font-size:8.5pt;color:var(--muted);overflow-wrap:anywhere}

.toolbar{display:none}
@media screen{
  html{background:#E4E4EA}
  body{padding:18mm 0 12mm}
  .toolbar{display:flex;position:fixed;inset:0 0 auto;z-index:1;align-items:center;justify-content:center;gap:5mm;padding:2.5mm 5mm;background:#fff;border-bottom:1px solid var(--rule);font-size:9pt;color:var(--muted)}
  .toolbar button{font:600 9pt "Inter Report",system-ui,sans-serif;color:#fff;background:var(--ink);border:0;border-radius:1.5mm;padding:2mm 4mm;cursor:pointer}
  .cover{height:297mm;padding:20mm 18mm 18mm}
  .section{margin-top:14mm}
  .section:first-child{margin-top:0}
  .cover,.content{width:210mm;max-width:100%;margin:0 auto 8mm;box-shadow:0 1px 3px rgba(0,0,0,.08),0 12px 32px rgba(0,0,0,.08)}
  .content{background:#fff;padding:18mm 16mm 20mm}
}
`;
}
