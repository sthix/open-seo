CREATE TABLE `agent_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`type` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`title` text NOT NULL,
	`brief` text NOT NULL,
	`target_url` text,
	`score` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'proposed' NOT NULL,
	`pr_url` text,
	`note` text,
	`queued_by_user_id` text,
	`queued_at` text,
	`claimed_at` text,
	`completed_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_tasks_project_dedupe_idx` ON `agent_tasks` (`project_id`,`dedupe_key`);--> statement-breakpoint
CREATE INDEX `agent_tasks_project_status_idx` ON `agent_tasks` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `agent_tasks_organization_idx` ON `agent_tasks` (`organization_id`);