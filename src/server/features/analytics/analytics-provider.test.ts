import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAnalytics } from "./analytics-provider";

afterEach(() => vi.unstubAllGlobals());

describe("analytics providers", () => {
  it("reads Umami Cloud metrics with the selected website and bearer key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ pageviews: 30, visitors: 12, visits: 20 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchAnalytics({
      provider: "umami",
      region: "cloud",
      propertyId: "c29d3cb2-5ed2-4391-b4d4-829566056bdb",
      apiKey: "secret",
    });
    expect(result).toEqual({ pageviews: 30, visitors: 12, visits: 20 });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(
      /^https:\/\/api\.umami\.is\/v1\/websites\/c29d3cb2-5ed2-4391-b4d4-829566056bdb\/stats\?/,
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: { Authorization: "Bearer secret" },
      redirect: "error",
    });
  });

  it("queries the selected PostHog region for pageviews and distinct IDs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ results: [[42, 15]] }));
    vi.stubGlobal("fetch", fetchMock);
    expect(
      await fetchAnalytics({
        provider: "posthog",
        region: "eu",
        propertyId: "123",
        apiKey: "secret",
      }),
    ).toEqual({ pageviews: 42, visitors: 15, visits: null });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://eu.posthog.com/api/projects/123/query/",
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      redirect: "error",
    });
  });

  it("does not turn provider failures or malformed metrics into zeroes", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(Response.json({ error: "denied" }, { status: 403 })),
    );
    const connection = {
      provider: "posthog",
      region: "us",
      propertyId: "123",
      apiKey: "secret",
    } as const;
    await expect(fetchAnalytics(connection)).rejects.toThrow();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ results: [] })),
    );
    await expect(fetchAnalytics(connection)).rejects.toThrow();
  });
});
