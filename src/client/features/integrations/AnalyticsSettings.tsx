import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CardShell } from "@/client/components/CardShell";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import {
  getAnalyticsConnections,
  saveAnalyticsConnection,
  deleteAnalyticsConnection,
} from "@/serverFunctions/analytics";

type Provider = "posthog" | "umami";

export function AnalyticsSettings({
  projectId,
  provider,
}: {
  projectId: string;
  provider: Provider;
}) {
  const [propertyId, setPropertyId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [region, setRegion] = useState<"eu" | "us">("eu");
  const client = useQueryClient();
  const queryKey = ["analytics-connections", projectId];
  const connections = useQuery({
    queryKey,
    queryFn: () => getAnalyticsConnections({ data: { projectId } }),
  });
  const existing = connections.data?.find((row) => row.provider === provider);
  const refresh = async () => {
    await client.invalidateQueries({ queryKey });
    await client.invalidateQueries({
      queryKey: ["analytics-report", projectId, provider],
    });
  };
  const save = useMutation({
    mutationFn: () =>
      saveAnalyticsConnection({
        data: {
          projectId,
          connection:
            provider === "posthog"
              ? {
                  provider,
                  propertyId: propertyId.trim(),
                  apiKey: apiKey.trim(),
                  region,
                }
              : {
                  provider,
                  propertyId: propertyId.trim(),
                  apiKey: apiKey.trim(),
                  region: "cloud",
                },
        },
      }),
    onSuccess: async () => {
      setApiKey("");
      setPropertyId("");
      await refresh();
      toast.success("Connection saved");
    },
    onError: (error) => toast.error(getStandardErrorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: () =>
      deleteAnalyticsConnection({ data: { projectId, provider } }),
    onSuccess: async () => {
      await refresh();
      toast.success("Connection removed");
    },
    onError: (error) => toast.error(getStandardErrorMessage(error)),
  });
  const label = provider === "posthog" ? "PostHog" : "Umami Cloud";
  return (
    <CardShell title={label}>
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          {existing
            ? `Connected to ${existing.propertyId}. Enter new details to replace the connection.`
            : "Connect website analytics to this project's dashboard."}
        </p>
        {connections.isError ? <p>Could not load connection status.</p> : null}
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div className="space-y-1">
            <label htmlFor={`${provider}-property`}>
              {provider === "posthog"
                ? "PostHog project ID"
                : "Umami website ID"}
            </label>
            <Input
              id={`${provider}-property`}
              value={propertyId}
              onChange={(event) => setPropertyId(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${provider}-key`}>
              {provider === "posthog"
                ? "Personal API key with query read access"
                : "Cloud API key"}
            </label>
            <Input
              id={`${provider}-key`}
              type="password"
              autoComplete="new-password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              required
            />
          </div>
          {provider === "posthog" ? (
            <div className="space-y-1">
              <label htmlFor="posthog-region">PostHog region</label>
              <select
                id="posthog-region"
                className="block rounded-md border bg-background px-3 py-2"
                value={region}
                onChange={(event) =>
                  setRegion(event.target.value === "us" ? "us" : "eu")
                }
              >
                <option value="eu">EU</option>
                <option value="us">US</option>
              </select>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending || remove.isPending}>
              Save connection
            </Button>
            {existing ? (
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending || remove.isPending}
                onClick={() => remove.mutate()}
              >
                Disconnect
              </Button>
            ) : null}
          </div>
        </form>
        <p className="text-muted-foreground">
          The key is encrypted on the server. The dashboard shows all traffic
          for the selected property.
        </p>
      </div>
    </CardShell>
  );
}
