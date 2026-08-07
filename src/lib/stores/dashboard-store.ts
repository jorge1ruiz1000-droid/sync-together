import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayISO } from "@/lib/format";

/**
 * Available `type` values for GET /api/v1/stats/top.
 * Mirrors the swagger enum: clients, games, operator-games, partners, days, months.
 */
export const STATS_TOP_TYPES = [
  "clients",
  "games",
  "operator-games",
  "partners",
  "days",
  "months",
] as const;
export type StatsTopType = (typeof STATS_TOP_TYPES)[number];

/**
 * Available `metric` values for GET /api/v1/stats/*.
 * Mirrors the swagger enum: ggr, total_bets, total_stake, players, total_won, total_voided.
 */
export const STATS_METRICS = [
  "ggr",
  "total_bets",
  "total_stake",
  "players",
  "total_won",
  "total_voided",
] as const;
export type StatsMetric = (typeof STATS_METRICS)[number];

export type ChartVariant = "bar" | "line";

export type ExplorerCard = {
  id: string;
  title: string;
  type: StatsTopType;
  metric: StatsMetric;
  variant: ChartVariant;
};

/** "all" = no operator filter, "operator" = a single operator is selected. */
export type ExplorerScope = "all" | "operator";

type DashboardFilters = {
  dateFrom: string;
  dateTo: string;
  /** Operator id as a string, empty means "all operators". Parsed to number in the API payload. */
  operatorId: string;
  /** Partner id as a string, empty means "all partners". */
  partnerId: string;
  /** Game id as a string, empty means "all games". */
  gameId: string;
  explorer: ExplorerCard[];
  explorerOperator: ExplorerCard[];
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  setOperatorId: (value: string) => void;
  setPartnerId: (value: string) => void;
  setGameId: (value: string) => void;
  setRange: (from: string, to: string) => void;
  updateCard: (scope: ExplorerScope, id: string, patch: Partial<Omit<ExplorerCard, "id">>) => void;

  addCard: (scope: ExplorerScope) => void;
  removeCard: (scope: ExplorerScope, id: string) => void;
  resetExplorer: (scope: ExplorerScope) => void;
  reset: () => void;
};

/** Which chart types make sense depending on whether one operator is selected. */
export const TYPES_BY_SCOPE: Record<ExplorerScope, readonly StatsTopType[]> = {
  all: STATS_TOP_TYPES,
  operator: ["days", "months", "games"],
};

const defaultExplorer = (): ExplorerCard[] => [
  { id: "c1", title: "GGR by day", type: "days", metric: "ggr", variant: "line" },
  { id: "c2", title: "Top operator games by GGR", type: "operator-games", metric: "ggr", variant: "bar" },
  { id: "c3", title: "Top clients by GGR", type: "clients", metric: "ggr", variant: "bar" },
  { id: "c4", title: "Top partners by players", type: "partners", metric: "players", variant: "bar" },
];

const defaultOperatorExplorer = (): ExplorerCard[] => [
  { id: "o1", title: "GGR by day", type: "days", metric: "ggr", variant: "line" },
  { id: "o2", title: "Top games by stake", type: "games", metric: "total_stake", variant: "bar" },
  { id: "o3", title: "Players by day", type: "days", metric: "players", variant: "line" },
  { id: "o4", title: "GGR by month", type: "months", metric: "ggr", variant: "bar" },
];

const listKey = (scope: ExplorerScope): "explorer" | "explorerOperator" =>
  scope === "operator" ? "explorerOperator" : "explorer";

const defaultsFor = (scope: ExplorerScope) =>
  scope === "operator" ? defaultOperatorExplorer() : defaultExplorer();

const initial = () => ({
  dateFrom: todayISO(),
  dateTo: todayISO(),
  operatorId: "",
  partnerId: "",
  gameId: "",
  explorer: defaultExplorer(),
  explorerOperator: defaultOperatorExplorer(),
});

export const useDashboardStore = create<DashboardFilters>()(
  persist(
    (set) => ({
      ...initial(),
      setDateFrom: (value) => set({ dateFrom: value }),
      setDateTo: (value) => set({ dateTo: value }),
      setOperatorId: (value) => set({ operatorId: value, gameId: "" }),
      setPartnerId: (value) => set({ partnerId: value }),
      setGameId: (value) => set({ gameId: value }),
      setRange: (from, to) => set({ dateFrom: from, dateTo: to }),
      updateCard: (scope, id, patch) =>
        set((state) => {
          const key = listKey(scope);
          return {
            [key]: state[key].map((card) => (card.id === id ? { ...card, ...patch } : card)),
          } as Partial<DashboardFilters>;
        }),
      addCard: (scope) =>
        set((state) => {
          const key = listKey(scope);
          return {
            [key]: [
              ...state[key],
              {
                id: `c${Date.now()}`,
                title: "New chart",
                type: "days" as StatsTopType,
                metric: "ggr" as StatsMetric,
                variant: "bar" as ChartVariant,
              },
            ],
          } as Partial<DashboardFilters>;
        }),
      removeCard: (scope, id) =>
        set((state) => {
          const key = listKey(scope);
          return { [key]: state[key].filter((card) => card.id !== id) } as Partial<DashboardFilters>;
        }),
      resetExplorer: (scope) =>
        set(() => ({ [listKey(scope)]: defaultsFor(scope) }) as Partial<DashboardFilters>),
      reset: () => set(initial()),
    }),

    {
      name: "bk-dashboard-filters",
      version: 5,
      // Dates always start at today, even for returning sessions.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        dateFrom: todayISO(),
        dateTo: todayISO(),
      }),
    },
  ),
);

/** Convert operatorId string → number for API payloads. */
export function parseOperatorId(value: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

