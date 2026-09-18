import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/dashboard/integrations")({
  component: DashboardIntegrations,
});

function DashboardIntegrations() {
  return (
    <SiteShell>
      <div className="py-10">
        <h1 className="text-2xl font-bold">Integrations Settings</h1>
      </div>
    </SiteShell>
  );
}
