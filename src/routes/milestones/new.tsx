import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/milestones/new")({
  component: NewMilestone,
});

function NewMilestone() {
  return (
    <SiteShell>
      <div className="py-10">
        <h1 className="text-2xl font-bold">Publish New Milestone</h1>
      </div>
    </SiteShell>
  );
}
