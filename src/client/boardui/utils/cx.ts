import { extendTailwindMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "cn";

/**
 * Text-style classes from styles/typography.css.
 *
 * IMPORTANT: every text-* utility we define via @theme (e.g. `text-body-medium`,
 * `text-title-1-semibold`) must be listed here. Otherwise tailwind-merge — which
 * has no view of our Tailwind theme — treats them as text-color utilities and
 * silently drops them when they appear in the same className as a real color
 * (`text-foreground-full`, `text-text-primary`, etc).
 *
 * If you add or rename a text style in typography.css, mirror the change here.
 */
const TEXT_FAMILIES = [
  "large-title",
  "display-1",
  "display-2",
  "display-3",
  "display-4",
  "title-1",
  "title-2",
  "title-3",
  "headline",
  "body",
  "body-2",
  "caption-1",
  "caption-2",
] as const;

const TEXT_WEIGHTS = ["regular", "medium", "semibold", "bold"] as const;

const TEXT_STYLE_SUFFIXES = TEXT_FAMILIES.flatMap((family) =>
  TEXT_WEIGHTS.map((weight) => `${family}-${weight}`),
);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: TEXT_STYLE_SUFFIXES }],
    },
  },
});

/**
 * clsx-style variadic merge (strings, arrays, objects, falsy values) that keeps
 * BoardUI's text-style utilities. Drop-in for the `cn` package in components
 * that mix BoardUI typography (`text-body-medium`) with text colors.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}
