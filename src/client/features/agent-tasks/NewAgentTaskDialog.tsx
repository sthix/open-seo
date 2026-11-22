import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { Input } from "@/client/components/ui/input";
import { Textarea } from "@/client/components/ui/textarea";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { ATTACHMENT_ACCEPT } from "@/shared/agent-task-attachments";
import { createAgentTask } from "@/serverFunctions/agentTasks";
import { checkFiles, formatBytes, toAttachmentInput } from "./attachmentFiles";

const optionalUrl = z.union([z.literal(""), z.string().trim().url()]);
const required = (label: string) => (value: string) =>
  value.trim() ? undefined : `${label} is required`;

/** A task a person writes themselves and hands to Claude Code. */
export function NewAgentTaskDialog({
  projectId,
  open,
  onOpenChange,
  onCreated,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<unknown>;
}) {
  const create = useMutation({
    mutationFn: async (data: {
      title: string;
      brief: string;
      targetUrl: string;
      queue: boolean;
      files: File[];
    }) =>
      createAgentTask({
        data: {
          projectId,
          title: data.title.trim(),
          brief: data.brief.trim(),
          targetUrl: data.targetUrl.trim() || null,
          queue: data.queue,
          attachments: await Promise.all(data.files.map(toAttachmentInput)),
        },
      }),
    onSuccess: async (task) => {
      await onCreated();
      form.reset();
      onOpenChange(false);
      toast.success(
        task.status === "queued"
          ? "Task sent to Claude Code"
          : "Task saved. Send it to Claude Code when you're ready.",
      );
    },
    onError: (error) => toast.error(getStandardErrorMessage(error)),
  });
  const form = useForm({
    defaultValues: {
      title: "",
      brief: "",
      targetUrl: "",
      queue: true,
      files: [] as File[],
    },
    onSubmit: ({ value }) => create.mutate(value),
  });
  const submit = (queue: boolean) => {
    form.setFieldValue("queue", queue);
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New task for Claude Code</DialogTitle>
          <DialogDescription>
            Describe the change. The runner does it in the site's repository and
            opens a pull request; its report, the PR and the outcome are logged
            on the task.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit(true);
          }}
        >
          <form.Field
            name="title"
            validators={{ onSubmit: ({ value }) => required("A title")(value) }}
          >
            {(field) => (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Title</span>
                <Input
                  maxLength={200}
                  placeholder="Add FAQ schema to the pricing page"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </label>
            )}
          </form.Field>
          <form.Field
            name="brief"
            validators={{ onSubmit: ({ value }) => required("A brief")(value) }}
          >
            {(field) => (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">What Claude should do</span>
                <Textarea
                  rows={9}
                  maxLength={20_000}
                  placeholder={
                    "What to change, where, and why. Markdown works.\n\nInclude the evidence you have (queries, URLs, numbers) and how to tell it's done."
                  }
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </label>
            )}
          </form.Field>
          <form.Field
            name="targetUrl"
            validators={{
              onSubmit: ({ value }) =>
                optionalUrl.safeParse(value).success
                  ? undefined
                  : "Enter a full URL, starting with https://",
            }}
          >
            {(field) => (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">
                  Page{" "}
                  <span className="font-normal text-text-secondary">
                    optional
                  </span>
                </span>
                <Input
                  type="url"
                  maxLength={500}
                  placeholder="https://example.com/pricing"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </label>
            )}
          </form.Field>
          <form.Field
            name="files"
            validators={{ onChange: ({ value }) => checkFiles(value) }}
          >
            {(field) => (
              <div className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">
                  Attachments{" "}
                  <span className="font-normal text-text-secondary">
                    optional: screenshots, copy, data or PDFs Claude should read
                  </span>
                </span>
                {field.state.value.length ? (
                  <ul className="divide-y divide-border-primary rounded-lg border border-border-primary">
                    {field.state.value.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 px-3 py-1.5"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {file.name}
                        </span>
                        <span className="text-caption-1 text-text-secondary">
                          {formatBytes(file.size)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            field.handleChange(
                              field.state.value.filter((_, i) => i !== index),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <label className="self-start">
                  <input
                    type="file"
                    multiple
                    accept={ATTACHMENT_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      const picked = [...(event.target.files ?? [])];
                      event.target.value = "";
                      field.handleChange([...field.state.value, ...picked]);
                    }}
                  />
                  <span className="inline-flex cursor-pointer items-center rounded-md border border-border-primary px-3 py-1.5 hover:bg-background-tertiary-default">
                    Add files
                  </span>
                </label>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={create.isPending}
              onClick={() => submit(false)}
            >
              Save for later
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Send to Claude Code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldErrors({ errors }: { errors: unknown[] }) {
  return errors.length ? (
    <span className="text-xs text-destructive">{errors.join(", ")}</span>
  ) : null;
}
