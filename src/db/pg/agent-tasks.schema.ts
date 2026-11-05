import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./better-auth-schema";
import { projects } from "./app.schema";

// See src/db/pg/app.schema.ts for why timestamps are ISO-8601 UTC text.
const isoNow = sql`to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

// See src/db/agent-tasks.schema.ts.
export const agentTasks = pgTable(
  "agent_tasks",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    title: text("title").notNull(),
    brief: text("brief").notNull(),
    targetUrl: text("target_url"),
    score: integer("score").notNull().default(0),
    status: text("status").notNull().default("proposed"),
    prUrl: text("pr_url"),
    note: text("note"),
    queuedByUserId: text("queued_by_user_id"),
    queuedAt: text("queued_at"),
    claimedAt: text("claimed_at"),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(isoNow),
    updatedAt: text("updated_at").notNull().default(isoNow),
  },
  (table) => [
    uniqueIndex("agent_tasks_project_dedupe_idx").on(
      table.projectId,
      table.dedupeKey,
    ),
    index("agent_tasks_project_status_idx").on(table.projectId, table.status),
    index("agent_tasks_organization_idx").on(table.organizationId),
  ],
);
