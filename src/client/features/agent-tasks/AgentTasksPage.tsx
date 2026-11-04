import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import { Checkbox } from "@/client/components/ui/checkbox";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import {
  dismissAgentTasks,
  findAgentTasks,
  listAgentTasks,
  queueAgentTasks,
} from "@/serverFunctions/agentTasks";

type Task = Awaited<ReturnType<typeof listAgentTasks>>[number];

const TYPE_LABELS: Record<string, string> = {
  search_console: "Search Console",
  site_audit: "Site audit",
  ai_visibility: "AI visibility",
  indexing: "Indexing",
};

const STATUS: Record<
  string,
  {
    label: string;
    variant:
      | "secondary"
      | "soft"
      | "info"
      | "success"
      | "warning"
      | "destructive";
  }
> = {
  proposed: { label: "Proposed", variant: "secondary" },
  queued: { label: "Waiting for Claude Code", variant: "soft" },
  claimed: { label: "Claude Code is working", variant: "info" },
  pr_opened: { label: "PR open", variant: "success" },
  no_change: { label: "No change", variant: "warning" },
  failed: { label: "Failed", variant: "destructive" },
};

// Tasks a person can send (again) to Claude Code.
const SENDABLE = new Set(["proposed", "no_change", "failed"]);

export function AgentTasksPage({ projectId }: { projectId: string }) {
  const client = useQueryClient();
  const queryKey = ["agent-tasks", projectId];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const tasks = useQuery({
    queryKey,
    queryFn: () => listAgentTasks({ data: { projectId } }),
    // Runner updates arrive while the page is open.
    refetchInterval: 30_000,
  });
  const refresh = () => client.invalidateQueries({ queryKey });
  const find = useMutation({
    mutationFn: () => findAgentTasks({ data: { projectId } }),
    onSuccess: async (result) => {
      await refresh();
      toast.success(
        `${result.added} new, ${result.updated} updated${result.errors.length ? `. Not checked: ${result.errors.map((error) => `${TYPE_LABELS[error.type]} (${error.message})`).join("; ")}` : ""}`,
      );
    },
    onError: (error) => toast.error(getStandardErrorMessage(error)),
  });
  const send = useMutation({
    mutationFn: () =>
      queueAgentTasks({ data: { projectId, taskIds: [...selected] } }),
    onSuccess: async ({ queued }) => {
      setSelected(new Set());
      await refresh();
      toast.success(
        `${queued} ${queued === 1 ? "task" : "tasks"} sent to Claude Code`,
      );
    },
    onError: (error) => toast.error(getStandardErrorMessage(error)),
  });
  const dismiss = useMutation({
    mutationFn: () =>
      dismissAgentTasks({ data: { projectId, taskIds: [...selected] } }),
    onSuccess: async () => {
      setSelected(new Set());
      await refresh();
    },
    onError: (error) => toast.error(getStandardErrorMessage(error)),
  });

  const visible = (tasks.data ?? []).filter(
    (task) => task.status !== "dismissed",
  );
  const sendable = visible.filter((task) => SENDABLE.has(task.status));
  const allSelected =
    sendable.length > 0 && sendable.every((task) => selected.has(task.id));
  const someSelected = !allSelected && selected.size > 0;
  const toggleAll = (on: boolean) =>
    setSelected(on ? new Set(sendable.map((task) => task.id)) : new Set());
  const toggle = (id: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-body-medium text-text-secondary">
        OpenSEO finds changes worth making from Search Console, the site audit,
        Prompt Tracking and Google's index. Pick the ones you want and send them
        to Claude Code: the runner on your Mac makes each change in the site's
        repository and opens a pull request. Nothing goes live until you merge
        it.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={find.isPending}
          onClick={() => find.mutate()}
        >
          {find.isPending ? "Looking for tasks…" : "Find tasks now"}
        </Button>
        <Button
          disabled={!selected.size || send.isPending}
          onClick={() => send.mutate()}
        >
          Send {selected.size || ""} to Claude Code
        </Button>
        <Button
          variant="ghost"
          disabled={!selected.size || dismiss.isPending}
          onClick={() => dismiss.mutate()}
        >
          Dismiss
        </Button>
      </div>
      {tasks.isLoading ? (
        <p className="text-body-medium text-text-secondary">Loading…</p>
      ) : !visible.length ? (
        <p className="text-body-medium text-text-secondary">
          No tasks yet. Click "Find tasks now", or wait for the nightly check.
        </p>
      ) : (
        <ul className="divide-y divide-border-primary rounded-xl border border-border-primary">
          <li className="flex items-center gap-3 p-3">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              disabled={!sendable.length}
              onCheckedChange={(value) => toggleAll(Boolean(value))}
              aria-label="Select all tasks"
            />
            <span className="text-body-medium text-text-secondary">
              {selected.size
                ? `${selected.size} of ${sendable.length} selected`
                : `Select all ${sendable.length} tasks`}
            </span>
          </li>
          {visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              checked={selected.has(task.id)}
              onCheck={(on) => toggle(task.id, on)}
              expanded={open === task.id}
              onExpand={() => setOpen(open === task.id ? null : task.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({
  task,
  checked,
  onCheck,
  expanded,
  onExpand,
}: {
  task: Task;
  checked: boolean;
  onCheck: (on: boolean) => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const status = STATUS[task.status] ?? STATUS.proposed;
  return (
    <li className="space-y-2 p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-0.5"
          checked={checked}
          disabled={!SENDABLE.has(task.status)}
          onCheckedChange={(value) => onCheck(Boolean(value))}
          aria-label={`Select ${task.title}`}
        />
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onExpand}
        >
          <span className="block text-body-medium text-text-primary">
            {task.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-caption-1 text-text-secondary">
            <Badge variant="outline">
              {TYPE_LABELS[task.type] ?? task.type}
            </Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
            <span>Value {task.score}</span>
          </span>
        </button>
        {task.prUrl ? (
          <a
            className="shrink-0 text-body-medium text-accent-600 hover:underline"
            href={task.prUrl}
            target="_blank"
            rel="noreferrer"
          >
            Review PR
          </a>
        ) : null}
      </div>
      {task.note ? (
        <p className="ml-7 whitespace-pre-wrap text-caption-1 text-text-secondary">
          {task.note}
        </p>
      ) : null}
      {expanded ? (
        <pre className="ml-7 max-h-96 overflow-auto rounded-lg bg-background-tertiary-default p-3 text-caption-1 whitespace-pre-wrap text-text-primary">
          {task.brief}
        </pre>
      ) : null}
    </li>
  );
}
