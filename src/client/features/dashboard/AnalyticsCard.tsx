import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CardShell } from "@/client/components/CardShell";
import { getAnalyticsReport } from "@/serverFunctions/analytics";
import { moreDetailsClass } from "./cardParts";

export function AnalyticsCard({
  projectId,
  provider,
}: {
  projectId: string;
  provider: "posthog" | "umami";
}) {
  const report = useQuery({
    queryKey: ["analytics-report", projectId, provider],
    queryFn: () => getAnalyticsReport({ data: { projectId, provider } }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const label = provider === "posthog" ? "PostHog" : "Umami";
  return (
    <CardShell
      title={label}
      action={
        <Link
          to="/p/$projectId/settings/integrations"
          params={{ projectId }}
          className={moreDetailsClass}
        >
          Manage
        </Link>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        All traffic · Last 28 days
      </p>
      {report.isPending ? (
        <p aria-busy>Loading analytics...</p>
      ) : report.isError ? (
        <p>Could not load analytics. Check the connection and try again.</p>
      ) : !report.data ? (
        <p>Connection removed.</p>
      ) : (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Pageviews</dt>
            <dd>{report.data.pageviews.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{provider === "posthog" ? "Distinct IDs" : "Visitors"}</dt>
            <dd>{report.data.visitors.toLocaleString()}</dd>
          </div>
          {report.data.visits !== null ? (
            <div className="flex justify-between">
              <dt>Visits</dt>
              <dd>{report.data.visits.toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>
      )}
    </CardShell>
  );
}
