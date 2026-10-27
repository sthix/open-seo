import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type * as Service from "./analytics-service";

vi.mock("cloudflare:workers", () => ({ env: { DATABASE_PROVIDER: "d1" } }));
let client: Client;
let service: typeof Service;

beforeAll(async () => {
  client = createClient({ url: "file::memory:" });
  const testDb = drizzle(client);
  // The service must load after its database is replaced with this real SQLite instance.
  vi.doMock("@/db", () => ({ db: testDb }));
  vi.doMock("@/lib/auth", () => ({
    getAuth: () => ({
      $context: Promise.resolve({
        secretConfig: "test-secret-with-at-least-32-characters",
      }),
    }),
  }));
  await client.executeMultiple(`
    CREATE TABLE analytics_connections (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, organization_id TEXT NOT NULL,
      provider TEXT NOT NULL, region TEXT NOT NULL, property_id TEXT NOT NULL,
      encrypted_key TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX analytics_connections_project_provider_idx ON analytics_connections(project_id, provider);
  `);
  service = await import("./analytics-service");
});
afterAll(() => client.close());

describe("analytics connection storage", () => {
  it("encrypts credentials and scopes reads and deletes to the organization", async () => {
    await service.saveAnalytics("project-a", "org-a", {
      provider: "posthog",
      region: "eu",
      propertyId: "123",
      apiKey: "sensitive-key",
    });
    const stored = await client.execute(
      "SELECT encrypted_key FROM analytics_connections",
    );
    expect(stored.rows[0].encrypted_key).not.toContain("sensitive-key");
    expect(await service.listAnalytics("project-a", "org-b")).toEqual([]);
    expect(
      await service.reportAnalytics("project-a", "org-b", "posthog"),
    ).toBeNull();
    await service.deleteAnalytics("project-a", "org-b", "posthog");
    expect(await service.listAnalytics("project-a", "org-a")).toEqual([
      { provider: "posthog", region: "eu", propertyId: "123" },
    ]);
    await service.deleteAnalytics("project-a", "org-a", "posthog");
    expect(await service.listAnalytics("project-a", "org-a")).toEqual([]);
  });
});
