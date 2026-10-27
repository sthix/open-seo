import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askDirectAiEngine, getDirectAiEngines } from "./directLlm";

const server = vi.hoisted(() => ({
  env: {} as Record<string, string>,
  hosted: false,
}));
vi.mock("@/server/lib/runtime-env", () => ({
  isHostedServerAuthMode: async () => server.hosted,
  getOptionalEnvValue: async (name: string) => server.env[name],
}));
vi.mock("@/server/lib/provider-access", () => ({
  hasDataforseoAccess: async () => false,
}));

function respondWith(...bodies: unknown[]) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const body of bodies)
    fetchMock.mockImplementationOnce(async () => Response.json(body));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  server.hosted = false;
  server.env = {
    AI_VISIBILITY_DIRECT_ENGINES:
      "claude, Perplexity,gemini,google_ai_overview",
    ANTHROPIC_API_KEY: "anthropic-key",
    PERPLEXITY_API_KEY: "perplexity-key",
    GEMINI_API_KEY: "gemini-key",
  };
});
afterEach(() => vi.unstubAllGlobals());

describe("direct AI engines", () => {
  it("uses the listed engines that have an API, and none when hosted", async () => {
    expect(await getDirectAiEngines()).toEqual(
      new Set(["claude", "perplexity", "gemini"]),
    );
    server.hosted = true;
    expect(await getDirectAiEngines()).toEqual(new Set());
  });

  it("fails an engine without its key before calling anything", async () => {
    const fetchMock = respondWith();
    await expect(
      askDirectAiEngine("chatgpt", "Best SEO tool?", "DE"),
    ).rejects.toMatchObject({ code: "AUTH_CONFIG_MISSING" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the site behind Gemini's redirect links and drops what it cannot name", async () => {
    respondWith({
      candidates: [
        {
          content: { parts: [{ text: "OpenSEO is popular." }] },
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc",
                  title: "openseo.so",
                },
              },
              {
                web: {
                  uri: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/def",
                  title: "Some article",
                },
              },
            ],
          },
        },
      ],
    });

    const answer = await askDirectAiEngine("gemini", "Best SEO tool?", "DE");

    expect(answer.citations).toEqual([
      {
        url: "https://openseo.so/",
        domain: "openseo.so",
        title: "openseo.so",
        position: 1,
      },
    ]);
  });

  it("counts only Perplexity's numbered citations, not every search result", async () => {
    const fetchMock = respondWith({
      choices: [{ message: { content: "Try OpenSEO [1]." } }],
      citations: ["https://openseo.so/"],
      search_results: [
        { url: "https://openseo.so/", title: "OpenSEO" },
        { url: "https://ahrefs.com/", title: "Ahrefs" },
      ],
    });

    const answer = await askDirectAiEngine(
      "perplexity",
      "Best SEO tool?",
      "DE",
    );

    expect(answer.citations).toMatchObject([
      { url: "https://openseo.so/", title: "OpenSEO" },
    ]);
    const body = fetchMock.mock.calls[0]?.[1]?.body;
    expect(typeof body === "string" ? JSON.parse(body) : body).toMatchObject({
      web_search_options: { user_location: { country: "DE" } },
    });
  });

  it("resumes a paused Claude search and reads citations from the final answer", async () => {
    const fetchMock = respondWith(
      { stop_reason: "pause_turn", content: [{ type: "server_tool_use" }] },
      {
        stop_reason: "end_turn",
        content: [
          {
            type: "text",
            text: "OpenSEO is a good fit.",
            citations: [
              {
                type: "web_search_result_location",
                url: "https://openseo.so/",
                title: "OpenSEO",
              },
            ],
          },
        ],
      },
    );

    const answer = await askDirectAiEngine("claude", "Best SEO tool?", "DE");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(answer.answerMarkdown).toBe("OpenSEO is a good fit.");
    expect(answer.citations).toMatchObject([{ domain: "openseo.so" }]);
  });
});
