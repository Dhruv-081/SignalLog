import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/notifications/")({
  component: Notifications,
});

function Notifications() {
  return (
    <SiteShell>
      <div className="py-10">
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
    </SiteShell>
  );
}
