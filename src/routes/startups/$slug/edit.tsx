import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/startups/$slug/edit")({
  component: EditStartup,
});

function EditStartup() {
  const { slug } = Route.useParams();
  return (
    <SiteShell>
      <div className="py-10">
        <h1 className="text-2xl font-bold">Edit Startup: {slug}</h1>
      </div>
    </SiteShell>
  );
}
