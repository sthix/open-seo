import { and, asc, inArray, isNotNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { aiObservations, aiRuns } from "@/db/schema";

/**
 * Clears the text of up to 90 answers collected before `cutoff` and marks them
 * cleared; sources and brand results stay. 90 keeps the id list under D1's
 * bound-parameter limit. Returns how many were cleared.
 */
export async function clearAnswerTextBefore(cutoff: Date, now: Date) {
  const rows = await db
    .select({ id: aiObservations.id })
    .from(aiObservations)
    .where(
      and(
        isNotNull(aiObservations.answerMarkdown),
        lt(aiObservations.collectedAt, cutoff.toISOString()),
      ),
    )
    .limit(90);
  if (rows.length)
    await db
      .update(aiObservations)
      .set({ answerMarkdown: null, answerClearedAt: now.toISOString() })
      .where(
        inArray(
          aiObservations.id,
          rows.map((row) => row.id),
        ),
      );
  return rows.length;
}

/** Deletes up to 80 finished runs older than 13 months, with their answers. */
export async function pruneAiHistory(now: Date) {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 13);
  const runs = await db
    .select({ id: aiRuns.id })
    .from(aiRuns)
    .where(
      and(
        lt(aiRuns.createdAt, cutoff.toISOString()),
        inArray(aiRuns.status, ["completed", "partial", "failed"]),
      ),
    )
    .orderBy(asc(aiRuns.createdAt))
    .limit(80);
  if (runs.length)
    await db.delete(aiRuns).where(
      inArray(
        aiRuns.id,
        runs.map((r) => r.id),
      ),
    );
}
