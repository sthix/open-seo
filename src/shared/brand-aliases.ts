import { z } from "zod";

// Other names a brand goes by in AI answers ("HelpScout" for "Help Scout").
// Stored one per line, like the project's AI research keywords: a short list
// of plain values that is only ever read whole.

const MAX_BRAND_ALIASES = 20;

export const brandAliasesSchema = z
  .array(z.string().trim().min(2).max(80))
  .max(MAX_BRAND_ALIASES)
  .describe(
    "Other names the brand appears as in AI answers, e.g. a spelling without spaces or a former name. Replaces the stored list; an empty list clears it.",
  );

export function parseBrandAliases(stored: string | null): string[] {
  return (stored ?? "")
    .split("\n")
    .map((alias) => alias.trim())
    .filter(Boolean);
}

/** An empty list is stored as "", so it clears rather than keeps aliases. */
export function formatBrandAliases(aliases: string[]): string {
  // The first spelling of a repeated alias wins.
  const unique = new Map<string, string>();
  for (const raw of aliases) {
    const alias = raw.trim().replace(/\s+/g, " ");
    if (alias && !unique.has(alias.toLowerCase()))
      unique.set(alias.toLowerCase(), alias);
  }
  return [...unique.values()].join("\n");
}
