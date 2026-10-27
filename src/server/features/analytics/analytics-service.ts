import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsConnections } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { analyticsConnectionInput, fetchAnalytics } from "./analytics-provider";
import type { z } from "zod";

type Provider = "posthog" | "umami";

async function find(
  projectId: string,
  organizationId: string,
  provider: Provider,
) {
  const [row] = await db
    .select()
    .from(analyticsConnections)
    .where(
      and(
        eq(analyticsConnections.projectId, projectId),
        eq(analyticsConnections.organizationId, organizationId),
        eq(analyticsConnections.provider, provider),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listAnalytics(projectId: string, organizationId: string) {
  const rows = await db
    .select({
      provider: analyticsConnections.provider,
      region: analyticsConnections.region,
      propertyId: analyticsConnections.propertyId,
    })
    .from(analyticsConnections)
    .where(
      and(
        eq(analyticsConnections.projectId, projectId),
        eq(analyticsConnections.organizationId, organizationId),
      ),
    );
  return rows;
}

export async function saveAnalytics(
  projectId: string,
  organizationId: string,
  connection: z.infer<typeof analyticsConnectionInput>,
) {
  const ctx = await getAuth().$context;
  const encryptedKey = await symmetricEncrypt({
    key: ctx.secretConfig,
    data: connection.apiKey,
  });
  const values = {
    projectId,
    organizationId,
    provider: connection.provider,
    region: connection.region,
    propertyId: connection.propertyId,
    encryptedKey,
  };
  await db
    .insert(analyticsConnections)
    .values({ id: crypto.randomUUID(), ...values })
    .onConflictDoUpdate({
      target: [analyticsConnections.projectId, analyticsConnections.provider],
      set: { ...values, updatedAt: sql`(current_timestamp)` },
    });
}

export async function deleteAnalytics(
  projectId: string,
  organizationId: string,
  provider: Provider,
) {
  await db
    .delete(analyticsConnections)
    .where(
      and(
        eq(analyticsConnections.projectId, projectId),
        eq(analyticsConnections.organizationId, organizationId),
        eq(analyticsConnections.provider, provider),
      ),
    );
}

export async function reportAnalytics(
  projectId: string,
  organizationId: string,
  provider: Provider,
) {
  const row = await find(projectId, organizationId, provider);
  if (!row) return null;
  const ctx = await getAuth().$context;
  const apiKey = await symmetricDecrypt({
    key: ctx.secretConfig,
    data: row.encryptedKey,
  });
  return fetchAnalytics(
    analyticsConnectionInput.parse({
      provider: row.provider,
      region: row.region,
      propertyId: row.propertyId,
      apiKey,
    }),
  );
}
