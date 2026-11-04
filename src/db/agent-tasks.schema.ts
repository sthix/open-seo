import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { organization } from "./better-auth-schema";
import { projects } from "./app.schema";

// Work OpenSEO found for a project that a coding agent can do in the site's
// repository: proposed by the task finder, queued by a person, then claimed
// and completed by a runner (runner/ in the agency repo) that opens a PR.
export const agentTasks = sqliteTable(
  "agent_tasks",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // search_console | site_audit | ai_visibility | indexing
    type: text("type").notNull(),
    // One task per finding: the finder updates a proposed task in place and
    // never re-proposes one a person dismissed or a runner finished.
    dedupeKey: text("dedupe_key").notNull(),
    title: text("title").notNull(),
    // Markdown: what to change and the evidence, written for the agent.
    brief: text("brief").notNull(),
    targetUrl: text("target_url"),
    score: integer("score").notNull().default(0),
    // proposed | queued | claimed | pr_opened | no_change | failed | dismissed
    status: text("status").notNull().default("proposed"),
    prUrl: text("pr_url"),
    note: text("note"),
    queuedByUserId: text("queued_by_user_id"),
    queuedAt: text("queued_at"),
    claimedAt: text("claimed_at"),
    completedAt: text("completed_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(current_timestamp)`),
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
