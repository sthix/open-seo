import { beforeEach, expect, it, vi } from "vitest";
import { AiVisibilityRepository as repo } from "./AiVisibilityRepository";
import { clearAnswerTextBefore } from "./aiVisibilityRetentionRepository";
import { configuration } from "../services/aiVisibilityTestFixtures";

const { testDb } = await vi.hoisted(async () => {
  const { createAiVisibilityTestDb } = await import("../aiVisibilityTestDb");
  return { testDb: await createAiVisibilityTestDb() };
});
vi.mock("cloudflare:workers", () => ({ env: { DATABASE_PROVIDER: "d1" } }));
vi.mock("@/db", () => ({ db: testDb.db }));
vi.mock("@/db/runBatch", () => ({ runBatch: testDb.runBatch }));

const rows = configuration({
  engines: ["chatgpt"],
  prompts: [{ text: "Which SEO tools?" }, { text: "Best rank tracker?" }],
});

async function saveAnswer(id: string, collectedAt: string) {
  await repo.persistAnswer({
    observationId: id,
    values: {
      status: "completed",
      collectedAt,
      answerMarkdown: "Try OpenSEO.",
    },
    sources: [
      {
        id: `${id}-source`,
        observationId: id,
        url: "https://openseo.so/",
        domain: "openseo.so",
        title: null,
        position: 1,
      },
    ],
    matches: [
      {
        id: `${id}-match`,
        observationId: id,
        name: "OpenSEO",
        domain: "openseo.so",
        own: true,
        mentioned: true,
        cited: true,
        firstMention: 4,
      },
    ],
  });
}

beforeEach(async () => {
  await testDb.seedProject();
  await repo.saveConfiguration(rows);
  await repo.createRun(
    {
      id: "run",
      trackerId: rows.tracker.id,
      projectId: "project",
      trigger: "scheduled",
      status: "completed",
      locationCode: 2840,
      languageCode: "en",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    rows.prompts.map((prompt, index) => ({
      id: `answer-${index}`,
      runId: "run",
      promptId: prompt.id,
      engine: "chatgpt",
      branded: false,
    })),
  );
  await saveAnswer("answer-0", "2026-01-01T00:00:00.000Z");
  await saveAnswer("answer-1", "2026-09-01T00:00:00.000Z");
});

it("clears old answer text but keeps its evidence and its answered status", async () => {
  const now = new Date("2026-09-05T12:00:00.000Z");

  expect(
    await clearAnswerTextBefore(new Date("2026-06-07T12:00:00.000Z"), now),
  ).toBe(1);

  expect(await repo.getObservation("answer-0")).toMatchObject({
    answerMarkdown: null,
    answerClearedAt: now.toISOString(),
  });
  expect(await repo.getObservation("answer-1")).toMatchObject({
    answerMarkdown: "Try OpenSEO.",
    answerClearedAt: null,
  });
  const evidence = await repo.getEvidence(["answer-0"]);
  expect(evidence.sources).toHaveLength(1);
  expect(evidence.matches).toMatchObject([{ mentioned: true, cited: true }]);
  expect(new Set(await repo.listAnsweredPromptIds(rows.tracker.id))).toEqual(
    new Set(rows.prompts.map((prompt) => prompt.id)),
  );
});
