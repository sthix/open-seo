import { createFileRoute } from "@tanstack/react-router";
import { ProjectPageHeader } from "@/client/features/projects/ProjectPageHeader";
import { AgentTasksPage } from "@/client/features/agent-tasks/AgentTasksPage";

export const Route = createFileRoute("/_app/p/$projectId/tasks")({
  component: AgentTasksRoute,
});

function AgentTasksRoute() {
  const { projectId } = Route.useParams();
  return (
    <div className="h-full overflow-auto px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <ProjectPageHeader projectId={projectId} title="Tasks" />
        <AgentTasksPage projectId={projectId} />
      </div>
    </div>
  );
}
