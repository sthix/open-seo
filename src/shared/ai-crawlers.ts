/**
 * The crawlers AI assistants send, by the user agent each one obeys in
 * robots.txt. `training` collects text for model training, `search` builds the
 * index an assistant answers from, and `user` fetches a page a person asked
 * about.
 */
export const AI_CRAWLERS = [
  { userAgent: "GPTBot", operator: "OpenAI", purpose: "training" },
  { userAgent: "OAI-SearchBot", operator: "OpenAI", purpose: "search" },
  { userAgent: "ChatGPT-User", operator: "OpenAI", purpose: "user" },
  { userAgent: "ClaudeBot", operator: "Anthropic", purpose: "training" },
  { userAgent: "Claude-SearchBot", operator: "Anthropic", purpose: "search" },
  { userAgent: "PerplexityBot", operator: "Perplexity", purpose: "search" },
  { userAgent: "Google-Extended", operator: "Google", purpose: "training" },
] as const;

export type AiCrawlerPurpose = (typeof AI_CRAWLERS)[number]["purpose"];
