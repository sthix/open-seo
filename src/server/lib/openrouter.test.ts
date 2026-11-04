import { generateText } from "ai";
import { beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";

const completion = () =>
  Response.json({
    choices: [
      {
        message: { role: "assistant", content: "ok" },
        finish_reason: "stop",
      },
    ],
  });

// The egress country is cached per module (one lookup per isolate), so each
// test needs a fresh module to run its own lookup.
beforeEach(() => {
  vi.resetModules();
});

async function requestedModel(trace: () => Promise<Response>) {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementationOnce(trace)
    .mockResolvedValueOnce(completion());
  const { buildChatAgentModel } = await import("./openrouter");
  await generateText({
    model: buildChatAgentModel({ apiKey: "key" }),
    prompt: "hi",
  });
  const body = z
    .object({ model: z.string() })
    .parse(JSON.parse(z.string().parse(fetchMock.mock.calls[1]?.[1]?.body)));
  return body.model;
}

it("sends OpenAI calls to MiniMax M3 from a country where OpenAI is blocked", async () => {
  expect(
    await requestedModel(async () => new Response("colo=HKG\nloc=HK\n")),
  ).toBe("minimax/minimax-m3");
});

it("stays on OpenAI when the country lookup fails", async () => {
  expect(
    await requestedModel(async () => {
      throw new Error("offline");
    }),
  ).toBe("openai/gpt-5.6-luna");
});

it("uses Mistral instead of OpenRouter on a self-hosted install with a Mistral key", async () => {
  const { getOpenRouterAccess } = await import("./openrouter");
  expect(
    getOpenRouterAccess({
      AUTH_MODE: "password",
      MISTRAL_API_KEY: "mistral",
      OPENROUTER_API_KEY: "openrouter",
    }),
  ).toEqual({ mistralApiKey: "mistral", model: undefined });
});

it("keeps OpenRouter on the hosted service, whose credits need its cost", async () => {
  const { getOpenRouterAccess } = await import("./openrouter");
  expect(
    getOpenRouterAccess({
      AUTH_MODE: "hosted",
      MISTRAL_API_KEY: "mistral",
      OPENROUTER_API_KEY: "openrouter",
    }),
  ).toEqual({ apiKey: "openrouter" });
});
