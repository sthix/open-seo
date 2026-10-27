import { env } from "cloudflare:workers";
import { getOptionalEnvValue } from "@/server/lib/runtime-env";
import {
  clearAnswerTextBefore,
  pruneAiHistory,
} from "../repositories/aiVisibilityRetentionRepository";
import { aiObjectHasExpired } from "./aiVisibilityStorage";

const CURSOR_KEY = "ai-visibility:retention-cursor";
/** Answers can quote real people, so their text is kept this long by default. */
const DEFAULT_ANSWER_RETENTION_DAYS = 90;

async function answerRetentionDays() {
  const days = Number(await getOptionalEnvValue("AI_ANSWER_RETENTION_DAYS"));
  return Number.isInteger(days) && days > 0
    ? days
    : DEFAULT_ANSWER_RETENTION_DAYS;
}

/** One bounded sweep page of expired exports per scheduler tick. */
export async function pruneAiVisibility() {
  const now = new Date();
  await pruneAiHistory(now);
  // Answer text goes first; the run and its brand results stay for trends.
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - (await answerRetentionDays()));
  await clearAnswerTextBefore(cutoff, now);
  const cursor = await env.KV.get(CURSOR_KEY);
  const page = await env.R2.list({
    prefix: "ai-visibility/",
    cursor: cursor ?? undefined,
    limit: 500,
    include: ["customMetadata"],
  });
  const expired = page.objects
    .filter((object) => aiObjectHasExpired(object, now.getTime()))
    .map((object) => object.key);
  if (expired.length) await env.R2.delete(expired);
  if (page.truncated) await env.KV.put(CURSOR_KEY, page.cursor);
  else await env.KV.delete(CURSOR_KEY);
}
