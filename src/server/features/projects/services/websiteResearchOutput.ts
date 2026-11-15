import { z } from "zod";
import { generatedAiTopicSchema } from "@/types/schemas/aiPromptSuggestions";
import { websiteResearchSchema } from "@/types/schemas/projectWebsite";

/** What the model fills in: only the fields the saved project is missing. */
export function researchOutputSchema(fields: {
  hasBrandName: boolean;
  missingOverview: boolean;
  missingCompetitors: boolean;
  needsTopics: boolean;
  missingTopics: boolean;
  savedTopicCount: number;
}) {
  return z.object({
    ...(fields.hasBrandName ? {} : { name: websiteResearchSchema.shape.name }),
    ...(fields.missingOverview
      ? { overview: websiteResearchSchema.shape.overview.max(3500) }
      : {}),
    ...(fields.missingCompetitors
      ? {
          competitors: z
            .array(
              websiteResearchSchema.shape.competitors.element.extend({
                // Validate URI format after generation; structured output rejects it.
                sourceUrl: z
                  .string()
                  .describe("Exact URL of a verified website page"),
              }),
            )
            .max(5),
        }
      : {}),
    ...(fields.needsTopics
      ? {
          suggestedTopics: z
            .array(generatedAiTopicSchema)
            .length(fields.missingTopics ? 5 : fields.savedTopicCount),
        }
      : {}),
    ...(fields.missingTopics
      ? {
          // Checked after generation, so a malformed extra keyword is dropped
          // instead of failing a run that is already billed.
          suggestedKeywords: z.array(z.string()),
        }
      : {}),
  });
}
