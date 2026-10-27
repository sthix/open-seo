import { sql } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { projects } from "./app.schema";
import { organization } from "./better-auth-schema";

const isoNow = sql`to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

// Keep this definition structurally identical to ../ga4.schema.ts.
export const ga4Connections = pgTable(
  "ga4_connections",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    propertyId: text("property_id").notNull(),
    propertyDisplayName: text("property_display_name").notNull(),
    propertyTimeZone: text("property_time_zone").notNull(),
    propertyCurrencyCode: text("property_currency_code").notNull(),
    connectedByUserId: text("connected_by_user_id").notNull(),
    ga4AccountId: text("ga4_account_id").notNull(),
    connectedAccountEmail: text("connected_account_email"),
    createdAt: text("created_at").notNull().default(isoNow),
    updatedAt: text("updated_at").notNull().default(isoNow),
  },
  (table) => [
    uniqueIndex("ga4_connections_project_idx").on(table.projectId),
    index("ga4_connections_organization_idx").on(table.organizationId),
    index("ga4_connections_connector_idx").on(
      table.connectedByUserId,
      table.ga4AccountId,
    ),
  ],
);

export const analyticsConnections = pgTable(
  "analytics_connections",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    region: text("region").notNull(),
    propertyId: text("property_id").notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    updatedAt: text("updated_at").notNull().default(isoNow),
  },
  (table) => [
    uniqueIndex("analytics_connections_project_provider_idx").on(
      table.projectId,
      table.provider,
    ),
  ],
);
