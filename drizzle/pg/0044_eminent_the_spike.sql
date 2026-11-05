CREATE TABLE "agent_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"type" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"title" text NOT NULL,
	"brief" text NOT NULL,
	"target_url" text,
	"score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"pr_url" text,
	"note" text,
	"queued_by_user_id" text,
	"queued_at" text,
	"claimed_at" text,
	"completed_at" text,
	"created_at" text DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') NOT NULL,
	"updated_at" text DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_tasks_project_dedupe_idx" ON "agent_tasks" USING btree ("project_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "agent_tasks_project_status_idx" ON "agent_tasks" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "agent_tasks_organization_idx" ON "agent_tasks" USING btree ("organization_id");