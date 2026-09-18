import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/founders/$handle/")({
  component: FounderProfile,
});

function FounderProfile() {
  const { handle } = Route.useParams();
  return (
    <SiteShell>
      <div className="py-10">
        <h1 className="text-2xl font-bold">Founder: @{handle}</h1>
      </div>
    </SiteShell>
  );
}
