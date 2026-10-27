import * as React from "react";
import { Pencil } from "lucide-react";
import { FormActions } from "@/client/components/FormActions";
import { SectionHeader } from "@/client/components/PageHeader";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import { splitAliases, useContextUpdate } from "./shared";

/** Other names the project's own brand goes by in AI answers. */
export function BrandAliasesSection({
  projectId,
  aliases,
}: {
  projectId: string;
  aliases: string[];
}) {
  const update = useContextUpdate(projectId);
  const [draft, setDraft] = React.useState<string | null>(null);

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Brand names"
        hint="Other names your brand appears as in AI answers, such as a spelling without spaces or a former name. Prompt Tracking counts them as mentions."
        action={
          draft === null ? (
            <Button
              variant="ghost"
              size="xs"
              disabled={update.isPending}
              onClick={() => setDraft(aliases.join(", "))}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          ) : null
        }
      />
      {draft === null ? (
        <p className="text-sm text-muted-foreground">
          {aliases.length ? aliases.join(", ") : "No other names yet."}
        </p>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (update.isPending) return;
            update.mutate([{ brandAliases: splitAliases(draft) }], {
              onSuccess: () => setDraft(null),
            });
          }}
        >
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Other names, separated by commas"
            aria-label="Other brand names"
          />
          <FormActions
            pending={update.isPending}
            onCancel={() => setDraft(null)}
            size="xs"
          />
        </form>
      )}
    </section>
  );
}
