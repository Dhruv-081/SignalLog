import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeading, SiteShell } from "@/components/site-shell";
import { MilestoneItem } from "@/components/milestone-item";
import { EmptyState, ErrorState, LoadingRows } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { listMilestones } from "@/lib/api";
import { MILESTONE_CATEGORIES } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/milestones/")({
  head: () => ({
    meta: [
      { title: "Public milestone timeline — Signallog" },
      {
        name: "description",
        content:
          "Every milestone published across Signallog: revenue, users, launches and ship logs, with verification status on each entry.",
      },
      { property: "og:title", content: "Public milestone timeline" },
      {
        property: "og:description",
        content: "Revenue, users and launches from founders building in public.",
      },
    ],
  }),
  component: MilestoneFeed,
});

function MilestoneFeed() {
  const [category, setCategory] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const milestones = useQuery({
    queryKey: ["milestones", "feed", category, verifiedOnly],
    queryFn: () => listMilestones({ category, verifiedOnly, limit: 50 }),
  });

  return (
    <SiteShell>
      <PageHeading
        eyebrow="public timeline"
        title="Milestone timeline"
        description="One column, newest first. Green means a connected integration confirmed the number."
      />

      <div className="flex flex-wrap items-center gap-2">
        {[{ value: "all", label: "All" }, ...MILESTONE_CATEGORIES].map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={category === item.value ? "signal" : "outline"}
            onClick={() => setCategory(item.value)}
          >
            {item.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant={verifiedOnly ? "signal" : "outline"}
          onClick={() => setVerifiedOnly((value) => !value)}
          className={cn("ml-auto")}
        >
          Verified only
        </Button>
      </div>

      <div className="mt-8 space-y-4">
        {milestones.isLoading ? <LoadingRows count={5} /> : null}
        {milestones.isError ? <ErrorState /> : null}
        {milestones.data?.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="No milestones match this filter. Try another category."
          />
        ) : null}
        {(milestones.data ?? []).map((milestone) => (
          <MilestoneItem key={milestone.id} milestone={milestone} />
        ))}
      </div>
    </SiteShell>
  );
}
