import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <SiteShell>
      <div className="py-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Dashboard content goes here.</p>
      </div>
    </SiteShell>
  );
}
