import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ReferenceSelect } from "@/components/dashboard/reference-select";
import { ApiErrorBox } from "@/components/dashboard/api-error";
import { apiRequest, normalizeList, type Dict } from "@/lib/api";
import { useAuth, useClientScope } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/games-catalog")({
  head: () => ({
    meta: [
      { title: "Games catalogue · BetKraft Backoffice" },
      {
        name: "description",
        content: "Browse the live game catalogue enabled for each client operator.",
      },
      { property: "og:title", content: "Games catalogue · BetKraft Backoffice" },
      {
        property: "og:description",
        content: "Browse the live game catalogue enabled for each client operator.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamesCatalogPage,
});

function str(row: Dict, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function GameCard({ row }: { row: Dict }) {
  const name = str(row, ["game_name", "master_game_name", "name", "partner_game_name"]) || "Untitled game";
  const partner = str(row, ["partner_name", "partner"]);
  const currency = str(row, ["currency", "default_currency"]);
  const status = str(row, ["status", "state"]);
  const thumb = str(row, ["thumbnail", "image", "image_url", "icon"]);
  const active = /^(1|active|enabled|true)$/i.test(status);

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-surface/60 transition-colors hover:border-primary/50">
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted/40">
        {thumb ? (
          <img
            src={thumb}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="truncate text-sm font-medium text-foreground">{name}</h3>
        <p className="truncate text-xs text-muted-foreground">{partner || "—"}</p>
        <div className="flex items-center gap-2 pt-1">
          {status ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px]",
                active
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {active ? "Active" : status}
            </span>
          ) : null}
          {currency ? (
            <span className="num text-[11px] text-muted-foreground">{currency}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function GamesCatalogPage() {
  const { user, ready, token } = useAuth();
  const scope = useClientScope(user);
  const [manualOperator, setManualOperator] = useState("");
  const [search, setSearch] = useState("");

  // Client admins are scoped automatically: single-client accounts resolve the
  // operator from the session, multi-client accounts use the active client.
  const operatorId = scope.clientAdmin ? (scope.singleClient ? "" : scope.operatorId ?? "") : manualOperator;
  const needsOperator = !scope.clientAdmin && !manualOperator;

  const query = useQuery({
    queryKey: ["games-catalog", operatorId, scope.singleClient],
    enabled: ready && Boolean(token) && !needsOperator,
    queryFn: async () => {
      const payload = await apiRequest("/api/v1/operator-games", {
        query: { page: 1, per_page: 100000, operator_id: operatorId || undefined },
      });
      return normalizeList(payload).rows;
    },
  });

  const rows = useMemo(() => {
    const list = query.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((row) =>
      [
        str(row, ["game_name", "master_game_name", "name"]),
        str(row, ["partner_name"]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [query.data, search]);

  return (
    <DashboardShell
      title="Games catalogue"
      subtitle="Games enabled for each client operator."
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        {!scope.clientAdmin ? (
          <div className="w-64">
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="catalog-operator">
              Client
            </label>
            <ReferenceSelect
              id="catalog-operator"
              kind="operator"
              value={manualOperator}
              onChange={setManualOperator}
            />
          </div>
        ) : null}
        <div className="w-64">
          <label className="mb-1 block text-xs text-muted-foreground" htmlFor="catalog-search">
            Search
          </label>
          <input
            id="catalog-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Game or partner name"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        {query.data ? (
          <p className="num pb-2 text-xs text-muted-foreground">{rows.length} games</p>
        ) : null}
      </div>

      {needsOperator ? (
        <p className="rounded-lg border border-border bg-surface/60 p-6 text-sm text-muted-foreground">
          Select a client to view its games catalogue.
        </p>
      ) : query.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl border border-border bg-surface/60" />
          ))}
        </div>
      ) : query.error ? (
        <ApiErrorBox error={query.error} />
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface/60 p-6 text-sm text-muted-foreground">
          No games found for this client.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((row, i) => (
            <GameCard key={str(row, ["id", "game_id"]) || i} row={row} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
