import { z } from "zod";

export const analyticsProvider = z.enum(["posthog", "umami"]);
export const analyticsConnectionInput = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("posthog"),
    region: z.enum(["eu", "us"]),
    propertyId: z.string().regex(/^\d{1,20}$/),
    apiKey: z.string().trim().min(1).max(512),
  }),
  z.object({
    provider: z.literal("umami"),
    region: z.literal("cloud"),
    propertyId: z.string().uuid(),
    apiKey: z.string().trim().min(1).max(512),
  }),
]);
type Connection = z.infer<typeof analyticsConnectionInput>;

const umamiResult = z.object({
  pageviews: z.number().nonnegative(),
  visitors: z.number().nonnegative(),
  visits: z.number().nonnegative(),
});
const posthogResult = z.object({
  results: z.tuple([
    z.tuple([z.number().nonnegative(), z.number().nonnegative()]),
  ]),
});

// Hosts are fixed to avoid sending stored credentials to user-supplied URLs.
// Both figures cover all traffic and deliberately do not claim to be organic.
export async function fetchAnalytics(connection: Connection) {
  const headers = {
    Authorization: `Bearer ${connection.apiKey}`,
    Accept: "application/json",
  };
  let response: Response;
  if (connection.provider === "umami") {
    const end = Date.now();
    const url = new URL(
      `https://api.umami.is/v1/websites/${connection.propertyId}/stats`,
    );
    url.searchParams.set("startAt", String(end - 28 * 24 * 60 * 60 * 1000));
    url.searchParams.set("endAt", String(end));
    response = await fetch(url, {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } else {
    const host =
      connection.region === "eu" ? "eu.posthog.com" : "us.posthog.com";
    response = await fetch(
      `https://${host}/api/projects/${connection.propertyId}/query/`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          query: {
            kind: "HogQLQuery",
            query:
              "SELECT count(), uniqExact(distinct_id) FROM events WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 28 DAY AND timestamp <= now()",
          },
          name: "openseo_dashboard_pageviews",
        }),
      },
    );
  }
  if (!response.ok) throw new Error("Analytics provider request failed");
  const data: unknown = await response.json();
  if (connection.provider === "umami") {
    const result = umamiResult.parse(data);
    return {
      pageviews: result.pageviews,
      visitors: result.visitors,
      visits: result.visits,
    };
  }
  const [[pageviews, visitors]] = posthogResult.parse(data).results;
  return { pageviews, visitors, visits: null };
}
