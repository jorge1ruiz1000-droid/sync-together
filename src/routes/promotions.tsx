import { createFileRoute } from "@tanstack/react-router";
import { TabbedResourcePage } from "@/components/dashboard/resource-page";

export const Route = createFileRoute("/promotions")({
  head: () => ({
    meta: [
      { title: "Promotions · BetKraft Backoffice" },
      { name: "description", content: "Bonus configs, freebet configs, capabilities, campaigns and awards for EuroVirtuals operators." },
      { property: "og:title", content: "Promotions · BetKraft Backoffice" },
      { property: "og:description", content: "Bonus configs, freebet configs, capabilities, campaigns and awards for EuroVirtuals operators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <TabbedResourcePage
      title="Promotions"
      subtitle="Bonus and freebet configuration, campaigns and awards"
      resourceKeys={["freebet-capabilities", "bonus-config", "freebet-config", "operator-game-freebets", "freebet-campaigns", "freebet-awards"]}
    />
  ),
});
