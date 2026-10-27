import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AiVisibilityRepository as repo } from "../repositories/AiVisibilityRepository";
import { collectAiModelBatch, prepareAiRun } from "./aiVisibilityCollection";
import { configuration, customer } from "./aiVisibilityTestFixtures";

const { testDb, llmResponse } = await vi.hoisted(async () => {
  const { createAiVisibilityTestDb } = await import("../aiVisibilityTestDb");
  return { testDb: await createAiVisibilityTestDb(), llmResponse: vi.fn() };
});
vi.mock("cloudflare:workers", () => ({ env: { DATABASE_PROVIDER: "d1" } }));
vi.mock("cloudflare:workflows", () => ({
  NonRetryableError: class extends Error {},
}));
vi.mock("@/db", () => ({ db: testDb.db }));
vi.mock("@/db/runBatch", () => ({ runBatch: testDb.runBatch }));
vi.mock("@/server/lib/runtime-env", () => ({
  isHostedServerAuthMode: async () => false,
  getOptionalEnvValue: async (name: string) =>
    ({ AI_VISIBILITY_DIRECT_ENGINES: "chatgpt", OPENAI_API_KEY: "sk-test" })[
      name
    ],
}));
vi.mock("@/server/lib/dataforseo", () => ({
  MAX_TASKS_PER_POST: 100,
  createDataforseoClient: () => ({ aiSearch: { llmResponse } }),
}));

const runId = "run";
const market = { locationCode: 2840, languageCode: "en" };

beforeEach(async () => {
  await testDb.seedProject();
  const rows = configuration({
    engines: ["chatgpt"],
    prompts: [{ text: "Which SEO tools?" }],
  });
  await repo.saveConfiguration(rows);
  await repo.createRun(
    {
      id: runId,
      trackerId: rows.tracker.id,
      projectId: "project",
      trigger: "scheduled",
      status: "running",
      ...market,
      createdAt: "2026-09-05T12:00:00.000Z",
    },
    [
      {
        id: "answer-0",
        runId,
        promptId: rows.prompts[0].id,
        engine: "chatgpt",
        branded: false,
      },
    ],
  );
});
afterEach(() => vi.unstubAllGlobals());

it("sends an engine with its own key to that engine's API, not DataForSEO", async () => {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    Response.json({
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: "Try OpenSEO.",
              annotations: [
                { type: "url_citation", url: "https://openseo.so/" },
              ],
            },
          ],
        },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const plan = await prepareAiRun(runId);
  // Even a scheduled run, which would queue ChatGPT at DataForSEO.
  expect(plan.batches).toEqual([]);
  await collectAiModelBatch(runId, customer, market, plan.modelBatches[0]);

  expect(llmResponse).not.toHaveBeenCalled();
  expect(fetchMock.mock.calls[0]?.[0]).toBe(
    "https://api.openai.com/v1/responses",
  );
  expect(await repo.getObservation("answer-0")).toMatchObject({
    status: "completed",
    answerMarkdown: "Try OpenSEO.",
  });
  expect((await repo.getEvidence(["answer-0"])).matches).toContainEqual(
    expect.objectContaining({
      domain: "openseo.so",
      mentioned: true,
      cited: true,
    }),
  );
});
