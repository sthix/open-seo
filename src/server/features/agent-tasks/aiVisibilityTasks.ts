import { sortBy } from "remeda";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  aiMatches,
  aiObservations,
  aiPrompts,
  aiRuns,
  aiSources,
} from "@/db/schema";
import type { ProposedAgentTask } from "./AgentTaskRepository";

const MAX_TASKS = 5;
const MAX_SOURCES = 8;

/**
 * Prompts from the latest finished Prompt Tracking run where AI engines name
 * a competitor but not the project's own brand: the buyer questions the site
 * is losing in AI answers. One task per prompt, most competitor mentions
 * first.
 */
export async function findAiVisibilityTasks(
  projectId: string,
): Promise<ProposedAgentTask[]> {
  const [run] = await db
    .select({ id: aiRuns.id, createdAt: aiRuns.createdAt })
    .from(aiRuns)
    .where(
      and(
        eq(aiRuns.projectId, projectId),
        inArray(aiRuns.status, ["completed", "partial"]),
      ),
    )
    .orderBy(desc(aiRuns.createdAt))
    .limit(1);
  if (!run) return [];
  const rows = await db
    .select({
      observationId: aiObservations.id,
      promptId: aiPrompts.id,
      prompt: aiPrompts.text,
      engine: aiObservations.engine,
      name: aiMatches.name,
      own: aiMatches.own,
      mentioned: aiMatches.mentioned,
    })
    .from(aiObservations)
    .innerJoin(aiPrompts, eq(aiPrompts.id, aiObservations.promptId))
    .innerJoin(aiMatches, eq(aiMatches.observationId, aiObservations.id))
    .where(
      and(
        eq(aiObservations.runId, run.id),
        eq(aiObservations.status, "completed"),
        eq(aiPrompts.archived, false),
      ),
    );
  const prompts = new Map<
    string,
    {
      text: string;
      ownMentioned: boolean;
      competitors: Map<string, Set<string>>;
      observationIds: Set<string>;
    }
  >();
  for (const row of rows) {
    const prompt = prompts.get(row.promptId) ?? {
      text: row.prompt,
      ownMentioned: false,
      competitors: new Map<string, Set<string>>(),
      observationIds: new Set<string>(),
    };
    prompt.observationIds.add(row.observationId);
    if (row.mentioned && row.own) prompt.ownMentioned = true;
    if (row.mentioned && !row.own)
      prompt.competitors.set(
        row.name,
        (prompt.competitors.get(row.name) ?? new Set<string>()).add(row.engine),
      );
    prompts.set(row.promptId, prompt);
  }
  const candidates = [...prompts]
    .filter(([, prompt]) => !prompt.ownMentioned && prompt.competitors.size)
    .map(([promptId, prompt]) => ({
      promptId,
      ...prompt,
      mentions: [...prompt.competitors.values()].reduce(
        (sum, engines) => sum + engines.size,
        0,
      ),
    }));
  const gaps = sortBy(candidates, [(gap) => gap.mentions, "desc"]).slice(
    0,
    MAX_TASKS,
  );
  return Promise.all(
    gaps.map(async (gap) => {
      const sources = await db
        .select({ url: aiSources.url, domain: aiSources.domain })
        .from(aiSources)
        .where(inArray(aiSources.observationId, [...gap.observationIds]))
        .orderBy(aiSources.position)
        .limit(MAX_SOURCES);
      const competitors = [...gap.competitors]
        .map(
          ([name, engines]) => `- ${name}: named by ${[...engines].join(", ")}`,
        )
        .join("\n");
      const cited = sources.length
        ? [...new Set(sources.map((source) => source.url))]
            .map((url) => `- ${url}`)
            .join("\n")
        : "- (none recorded)";
      return {
        type: "ai_visibility" as const,
        dedupeKey: `ai_visibility:${gap.promptId}`,
        title: `Get mentioned in AI answers to "${gap.text.slice(0, 80)}"`,
        brief: `## Get the brand into AI answers to: "${gap.text}"

In the Prompt Tracking run of ${run.createdAt}, AI engines answered this buyer question without naming this site's brand, but named competitors:

${competitors}

Pages the engines cited for it:

${cited}

### What to do
1. Find the page on this site that best answers this question (search the content and page files).
2. Improve that page so it answers the question directly and clearly: an answer-first paragraph near the top, or a short FAQ entry with the question as its heading. AI engines quote pages that state the answer plainly.
3. Use only facts the site already states. Don't invent numbers, prices, results, testimonials or claims about competitors.
4. If no existing page fits, change nothing. Instead, propose in your final message which new page would answer it, with a title and an outline. A person decides whether to write it.

This is content work that a person reviews in full before merging.`,
        targetUrl: null,
        score: gap.mentions * 25,
      };
    }),
  );
}
