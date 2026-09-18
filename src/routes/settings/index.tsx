import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/settings/")({
  component: Settings,
});

function Settings() {
  return (
    <SiteShell>
      <div className="py-10">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
    </SiteShell>
  );
}
