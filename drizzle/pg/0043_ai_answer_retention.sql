ALTER TABLE "ai_observations" ADD COLUMN "answer_cleared_at" text;--> statement-breakpoint
CREATE INDEX "ai_observations_collected_idx" ON "ai_observations" USING btree ("collected_at");