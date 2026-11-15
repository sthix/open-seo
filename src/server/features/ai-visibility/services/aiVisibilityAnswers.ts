import type { AiTrackingAnswer } from "@/server/lib/dataforseo";
import type { AiBrand, AiEngine } from "@/shared/ai-visibility";
import { AiVisibilityRepository as repo } from "../repositories/AiVisibilityRepository";
import {
  parseDataforseoAnswer,
  type ParsedAiAnswer,
} from "../providers/dataforseoEvidence";
import { aiBrands } from "./aiVisibilityConfiguration";
import { matchAiBrand } from "./aiVisibilityMatching";

/** Brands come from the project as each answer is matched. */
export async function runBrands(runId: string) {
  const run = await repo.getRunInternal(runId);
  const project = run ? await repo.getProject(run.projectId) : null;
  if (!run || !project) return null;
  return aiBrands(project, await repo.listCompetitors(project.id));
}

/** Saves a finished answer with its citations and brand results, or fails it. */
export async function saveAiOutcome(
  runId: string,
  task: { tag: string; engine: AiEngine },
  outcome: AiTrackingAnswer,
  brands: AiBrand[],
) {
  if (outcome.status === "failed") {
    console.warn(
      `[ai-visibility] ${runId} answer ${task.tag} failed: ${outcome.message}`,
    );
    await repo.failPendingObservations(runId, outcome.code, [task.tag]);
    return;
  }
  const answer = parseDataforseoAnswer(outcome.result, task.engine);
  if (!answer) {
    console.error(
      `[ai-visibility] ${runId} answer ${task.tag} has a shape we cannot read`,
    );
    await repo.failPendingObservations(runId, "INTERNAL_ERROR", [task.tag]);
    return;
  }
  await saveAiAnswer(task.tag, answer, brands);
}

/** Saves one answer with its citations and brand results. */
export async function saveAiAnswer(
  observationId: string,
  answer: ParsedAiAnswer,
  brands: AiBrand[],
) {
  await repo.persistAnswer({
    observationId,
    values: {
      status: "completed",
      collectedAt: answer.collectedAt ?? new Date().toISOString(),
      answerMarkdown: answer.answerMarkdown,
      error: null,
    },
    sources: answer.citations.map((citation) => ({
      id: crypto.randomUUID(),
      observationId,
      ...citation,
    })),
    // Name and domain are copied so later edits never rewrite history;
    // aliases only decide the match.
    matches: brands.map((brand) => ({
      id: crypto.randomUUID(),
      observationId,
      name: brand.name,
      domain: brand.domain,
      own: brand.own,
      ...matchAiBrand(answer, brand),
    })),
  });
}
