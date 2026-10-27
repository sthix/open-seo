import { z } from "zod";
import { AppError } from "@/server/lib/errors";
import { hasDataforseoAccess } from "@/server/lib/provider-access";
import {
  getOptionalEnvValue as readEnv,
  isHostedServerAuthMode,
} from "@/server/lib/runtime-env";
import type { AiEngine } from "@/shared/ai-visibility";
import { parseCitedAnswer, type ParsedAiAnswer } from "./dataforseoEvidence";

// Asks each engine's own API with web search, using the operator's keys
// instead of DataForSEO. Self-hosted only: hosted answers are billed through
// DataForSEO. AI_VISIBILITY_DIRECT_ENGINES names the engines that use it, for
// example "claude,perplexity,gemini". Google AI Overviews have no API.

type DirectAiEngine = Exclude<AiEngine, "google_ai_overview">;

const ENGINES = {
  chatgpt: { keyEnv: "OPENAI_API_KEY", modelEnv: "OPENAI_MODEL" },
  perplexity: { keyEnv: "PERPLEXITY_API_KEY", modelEnv: "PERPLEXITY_MODEL" },
  gemini: { keyEnv: "GEMINI_API_KEY", modelEnv: "GEMINI_MODEL" },
  claude: { keyEnv: "ANTHROPIC_API_KEY", modelEnv: "CLAUDE_MODEL" },
} as const satisfies Record<
  DirectAiEngine,
  { keyEnv: string; modelEnv: string }
>;

const DEFAULT_MODELS: Record<DirectAiEngine, string> = {
  chatgpt: "gpt-5",
  perplexity: "sonar",
  gemini: "gemini-2.5-flash",
  claude: "claude-opus-5-5",
};

const REQUEST_TIMEOUT_MS = 120_000;
const REQUEST_RETRIES = 2;
/** A long server-side search can stop with pause_turn; resume it this often. */
const CLAUDE_MAX_PAUSES = 3;

function isDirectAiEngine(engine: string): engine is DirectAiEngine {
  return engine in ENGINES;
}

/** The engines this deployment asks with its own keys. */
export async function getDirectAiEngines(): Promise<Set<AiEngine>> {
  if (await isHostedServerAuthMode()) return new Set();
  const setting = (await readEnv("AI_VISIBILITY_DIRECT_ENGINES")) ?? "";
  return new Set(
    setting
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(isDirectAiEngine),
  );
}

/**
 * Whether answers from these engines can be collected: each has its own key
 * setting, or DataForSEO is configured for the rest.
 */
export async function canCollectAiAnswers(engines: AiEngine[]) {
  const direct = await getDirectAiEngines();
  if (engines.length > 0 && engines.every((engine) => direct.has(engine)))
    return true;
  return hasDataforseoAccess();
}

/** One answer with web search, searching from `country` where the API can. */
export async function askDirectAiEngine(
  engine: AiEngine,
  prompt: string,
  country: string,
): Promise<ParsedAiAnswer> {
  if (!isDirectAiEngine(engine))
    throw new AppError("INTERNAL_ERROR", `${engine} has no direct API`);
  const { keyEnv, modelEnv } = ENGINES[engine];
  const apiKey = await readEnv(keyEnv);
  if (!apiKey)
    throw new AppError("AUTH_CONFIG_MISSING", `${keyEnv} is not set.`);
  const model = (await readEnv(modelEnv)) ?? DEFAULT_MODELS[engine];
  const collectedAt = new Date().toISOString();
  switch (engine) {
    case "chatgpt":
      return parseChatgpt(
        await askChatgpt(apiKey, model, prompt, country),
        collectedAt,
      );
    case "perplexity":
      return parsePerplexity(
        await askPerplexity(apiKey, model, prompt, country),
        collectedAt,
      );
    case "gemini":
      return parseGemini(await askGemini(apiKey, model, prompt), collectedAt);
    case "claude":
      return parseClaude(
        await askClaude(apiKey, model, prompt, country),
        collectedAt,
      );
  }
}

/** POST JSON with a timeout, retrying 429 and 5xx with backoff. */
async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.ok) return response.json();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= REQUEST_RETRIES) {
      const detail = (await response.text()).slice(0, 500);
      throw new AppError(
        response.status === 429 ? "RATE_LIMITED" : "UPSTREAM_UNAVAILABLE",
        `${new URL(url).host} ${response.status}: ${detail}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
  }
}

// ChatGPT: OpenAI Responses API with the web search tool, the closest API
// match to ChatGPT with search.

const chatgptSchema = z.object({
  output: z
    .array(
      z.object({
        type: z.string(),
        content: z
          .array(
            z.object({
              type: z.string(),
              text: z.string().optional(),
              annotations: z
                .array(
                  z.object({
                    type: z.string(),
                    url: z.string().optional(),
                    title: z.string().optional(),
                  }),
                )
                .optional(),
            }),
          )
          .optional(),
      }),
    )
    .default([]),
});

function askChatgpt(
  apiKey: string,
  model: string,
  prompt: string,
  country: string,
) {
  return postJson(
    "https://api.openai.com/v1/responses",
    { Authorization: `Bearer ${apiKey}` },
    {
      model,
      input: prompt,
      tools: [
        {
          type: "web_search",
          user_location: { type: "approximate", country },
        },
      ],
    },
  );
}

function parseChatgpt(raw: unknown, collectedAt: string) {
  let markdown = "";
  const sources: { url: string; title?: string }[] = [];
  for (const item of chatgptSchema.parse(raw).output) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type !== "output_text") continue;
      markdown += part.text ?? "";
      for (const annotation of part.annotations ?? [])
        if (annotation.type === "url_citation" && annotation.url)
          sources.push({ url: annotation.url, title: annotation.title });
    }
  }
  return parseCitedAnswer(markdown, sources, collectedAt);
}

// Perplexity: sonar chat completions. `citations` is the numbered list the
// answer's [1], [2] markers point to; other search results were not cited.

const perplexitySchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().nullish() }).nullish(),
      }),
    )
    .default([]),
  citations: z.array(z.string()).default([]),
  search_results: z
    .array(z.object({ url: z.string(), title: z.string().nullish() }))
    .default([]),
});

function askPerplexity(
  apiKey: string,
  model: string,
  prompt: string,
  country: string,
) {
  return postJson(
    "https://api.perplexity.ai/chat/completions",
    { Authorization: `Bearer ${apiKey}` },
    {
      model,
      messages: [{ role: "user", content: prompt }],
      web_search_options: { user_location: { country } },
    },
  );
}

function parsePerplexity(raw: unknown, collectedAt: string) {
  const data = perplexitySchema.parse(raw);
  const titles = new Map(
    data.search_results.map((result) => [result.url, result.title]),
  );
  return parseCitedAnswer(
    data.choices[0]?.message?.content ?? "",
    data.citations.map((url) => ({ url, title: titles.get(url) })),
    collectedAt,
  );
}

// Gemini: generateContent with Google Search grounding. The search tool takes
// no location, so results follow the prompt's language.

const geminiSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z
          .object({
            parts: z
              .array(z.object({ text: z.string().optional() }))
              .default([]),
          })
          .nullish(),
        groundingMetadata: z
          .object({
            groundingChunks: z
              .array(
                z.object({
                  web: z
                    .object({
                      uri: z.string().optional(),
                      title: z.string().optional(),
                    })
                    .optional(),
                }),
              )
              .default([]),
          })
          .nullish(),
      }),
    )
    .default([]),
});

/** Gemini cites through this redirector; the chunk title holds the site. */
const GEMINI_REDIRECT_HOST = "vertexaisearch.cloud.google.com";

function askGemini(apiKey: string, model: string, prompt: string) {
  return postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    { "x-goog-api-key": apiKey },
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
    },
  );
}

function parseGemini(raw: unknown, collectedAt: string) {
  const candidate = geminiSchema.parse(raw).candidates[0];
  const markdown = (candidate?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("");
  const sources = (candidate?.groundingMetadata?.groundingChunks ?? []).flatMap(
    ({ web }) => {
      if (!web?.uri) return [];
      // The redirect expires and names Google, not the cited site. Keep the
      // site, which the title holds when it looks like a domain.
      const redirected = URL.canParse(web.uri)
        ? new URL(web.uri).hostname === GEMINI_REDIRECT_HOST
        : false;
      if (!redirected) return [{ url: web.uri, title: web.title }];
      return web.title && /^[\w.-]+\.[a-z]{2,}$/i.test(web.title)
        ? [{ url: `https://${web.title.toLowerCase()}/`, title: web.title }]
        : [];
    },
  );
  return parseCitedAnswer(markdown, sources, collectedAt);
}

// Claude: Messages API with the web search server tool.

const claudeSchema = z.object({
  stop_reason: z.string().nullish(),
  content: z.array(
    z.looseObject({
      type: z.string(),
      text: z.string().optional(),
      citations: z
        .array(
          z.object({
            type: z.string(),
            url: z.string().optional(),
            title: z.string().nullish(),
          }),
        )
        .nullish(),
    }),
  ),
});

async function askClaude(
  apiKey: string,
  model: string,
  prompt: string,
  country: string,
) {
  const messages: { role: "user" | "assistant"; content: unknown }[] = [
    { role: "user", content: prompt },
  ];
  let message: z.infer<typeof claudeSchema> | undefined;
  for (let pause = 0; pause <= CLAUDE_MAX_PAUSES; pause++) {
    message = claudeSchema.parse(
      await postJson(
        "https://api.anthropic.com/v1/messages",
        {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "server-side-fallback-2026-07-01",
        },
        {
          model,
          max_tokens: 16000,
          output_config: { effort: "medium" },
          fallbacks: "default",
          tools: [
            {
              type: "web_search_20260209",
              name: "web_search",
              max_uses: 5,
              user_location: { type: "approximate", country },
            },
          ],
          messages,
        },
      ),
    );
    if (message.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: message.content });
  }
  if (message?.stop_reason === "refusal")
    throw new AppError("UPSTREAM_UNAVAILABLE", "Claude declined the prompt.");
  return message;
}

function parseClaude(
  message: z.infer<typeof claudeSchema> | undefined,
  collectedAt: string,
) {
  let markdown = "";
  const sources: { url: string; title?: string | null }[] = [];
  for (const block of message?.content ?? []) {
    if (block.type !== "text") continue;
    markdown += block.text ?? "";
    for (const citation of block.citations ?? [])
      if (citation.type === "web_search_result_location" && citation.url)
        sources.push({ url: citation.url, title: citation.title });
  }
  return parseCitedAnswer(markdown, sources, collectedAt);
}
