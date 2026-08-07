import { useState } from "react";
import { DashboardShell } from "./dashboard-shell";
import { ResourceView } from "./resource-view";
import { RESOURCES } from "@/lib/endpoints";
import { cn } from "@/lib/utils";
import { stripEndpoint } from "@/lib/format";

export function ResourcePage({ resourceKey }: { resourceKey: string }) {
  const resource = RESOURCES[resourceKey];
  return (
    <DashboardShell title={resource.title} subtitle={stripEndpoint(resource.description)}>
      <ResourceView resource={resource} />
    </DashboardShell>
  );
}

export function TabbedResourcePage({
  title,
  subtitle,
  resourceKeys,
}: {
  title: string;
  subtitle: string;
  resourceKeys: string[];
}) {
  const [active, setActive] = useState(resourceKeys[0]);
  const resource = RESOURCES[active];

  return (
    <DashboardShell title={title} subtitle={subtitle}>
      <div className="mb-4 flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface/60 p-1.5">
        {resourceKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              key === active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {RESOURCES[key].title}
          </button>
        ))}
      </div>
      <p className="num mb-4 text-xs text-muted-foreground">{stripEndpoint(resource.description)}</p>
      <ResourceView resource={resource} />
    </DashboardShell>
  );
}
