import { z } from "zod";
import { AuditRepository } from "@/server/features/audit/repositories/AuditRepository";
import type { ProposedAgentTask } from "./AgentTaskRepository";

// Audit issues a change in the site's repository can fix, with what to do.
// Server errors, slow responses, crawl limits and thin content need other
// work (hosting, writing) and are left to people.
const FIXABLE: Record<string, { label: string; fix: string }> = {
  "broken-internal-link": {
    label: "Fix broken internal links",
    fix: "Find each link to the broken target listed for these pages and point it at the right page, or remove it if the target no longer exists. Don't create redirects unless the repository already manages them in a redirects file.",
  },
  "redirect-chain": {
    label: "Link straight to the final URL instead of through redirects",
    fix: "Update internal links on these pages so they point at the final URL, and shorten redirect chains in the redirects file if the repository has one.",
  },
  "missing-title": {
    label: "Add missing page titles",
    fix: "Give each page a unique title of at most 60 characters that says what the page is about, in the page's language.",
  },
  "duplicate-title": {
    label: "Make duplicate page titles unique",
    fix: "These pages share a title with the other URLs listed. Give each one a distinct title of at most 60 characters. Where two URLs are language versions of the same page, the titles should be in each page's language.",
  },
  "title-too-long": {
    label: "Shorten page titles",
    fix: "Shorten each title to at most 60 characters, keeping the main search term near the start.",
  },
  "title-too-short": {
    label: "Make short page titles more descriptive",
    fix: "Expand each title to 30–60 characters so it says what the page offers.",
  },
  "missing-meta-description": {
    label: "Add missing meta descriptions",
    fix: "Write a meta description of 120–155 characters for each page that summarises it and gives a reason to click.",
  },
  "duplicate-meta-description": {
    label: "Make duplicate meta descriptions unique",
    fix: "Give each page its own meta description of 120–155 characters.",
  },
  "meta-description-too-long": {
    label: "Shorten meta descriptions",
    fix: "Shorten each meta description to at most 155 characters.",
  },
  "meta-description-too-short": {
    label: "Expand short meta descriptions",
    fix: "Expand each meta description to 120–155 characters.",
  },
  "missing-h1": {
    label: "Add a main heading (H1)",
    fix: "Give each page exactly one H1 that matches its topic.",
  },
  "multiple-h1": {
    label: "Use one main heading (H1) per page",
    fix: "Keep one H1 per page and turn the others into H2s.",
  },
  "heading-order-skip": {
    label: "Fix skipped heading levels",
    fix: "Change heading levels so they don't skip (for example H2 followed by H4). Change only the level, not the text or the visual style.",
  },
  "images-missing-alt": {
    label: "Add alt text to images",
    fix: "Add short, descriptive alt text to the images without it. Use an empty alt only for purely decorative images.",
  },
  "canonical-conflict": {
    label: "Fix conflicting canonical tags",
    fix: "Make each page's canonical point at its own preferred URL, consistent with its sitemap entry and hreflang links.",
  },
  "orphan-page": {
    label: "Link to pages nothing links to",
    fix: "Add a relevant internal link to each page from one or two related pages or an overview page.",
  },
};
const SEVERITY_WEIGHT = { critical: 50, warning: 20, info: 5 } as const;
const MAX_PAGES_PER_TASK = 25;

const details = z.looseObject({}).catch({});

/** One task per fixable issue type in the project's latest audit. */
export async function findSiteAuditTasks(
  projectId: string,
): Promise<ProposedAgentTask[]> {
  const audit = await AuditRepository.getLatestAuditForProject(projectId);
  if (!audit || audit.status !== "completed") return [];
  const issues = await AuditRepository.getIssuesForAudit(audit.id, {});
  const byType = new Map<string, typeof issues>();
  for (const issue of issues) {
    if (!FIXABLE[issue.issueType]) continue;
    byType.set(issue.issueType, [
      ...(byType.get(issue.issueType) ?? []),
      issue,
    ]);
  }
  return [...byType].map(([issueType, found]) => {
    const { label, fix } = FIXABLE[issueType];
    const pages = found.slice(0, MAX_PAGES_PER_TASK);
    const list = pages
      .map((issue) => {
        const extra = issue.detailsJson
          ? JSON.stringify(details.parse(JSON.parse(issue.detailsJson)))
          : "";
        return `- ${issue.pageUrl}${extra && extra !== "{}" ? ` — ${extra}` : ""}`;
      })
      .join("\n");
    const more =
      found.length > pages.length
        ? `\n\n${found.length - pages.length} more pages have this issue; they'll come up in a later task.`
        : "";
    return {
      type: "site_audit" as const,
      dedupeKey: `site_audit:${audit.id}:${issueType}`,
      title: `${label} (${found.length} ${found.length === 1 ? "page" : "pages"})`,
      brief: `## ${label}

The site audit from ${audit.startedAt} found \`${issueType}\` on ${found.length} ${found.length === 1 ? "page" : "pages"}:

${list}${more}

### What to do
${fix}

Find the files that render these URLs in this repository. Change only what this issue needs, keep every fact the pages state, and don't invent new claims. If an issue is intended (for example a page that should stay out of search), leave it and say so in your final message.`,
      targetUrl: null,
      score: Math.min(1000, found.length * SEVERITY_WEIGHT[found[0].severity]),
    };
  });
}
