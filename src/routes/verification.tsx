import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, CircleAlert, GitBranch, CreditCard } from "lucide-react";

import { PageHeading, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "How milestone verification works — Signallog" },
      {
        name: "description",
        content:
          "Signallog stamps milestones verified only when a connected source like Stripe or GitHub confirms the number. Everything else stays labelled self-reported.",
      },
      { property: "og:title", content: "How milestone verification works" },
      {
        property: "og:description",
        content: "Verified, self-reported and demo data — clearly separated.",
      },
    ],
  }),
  component: Verification,
});

function Verification() {
  return (
    <SiteShell>
      <PageHeading
        eyebrow="trust model"
        title="Verification, not vibes"
        description="Three states, never blended: verified by a connected source, self-reported by the founder, or demo data in this preview environment."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {[
          {
            icon: BadgeCheck,
            tone: "text-verified",
            title: "Verified",
            body: "A connected integration returned the number. The milestone carries the source name — Stripe or GitHub — on the badge.",
          },
          {
            icon: CircleAlert,
            tone: "text-demo",
            title: "Self-reported",
            body: "The founder typed it. Still useful, never presented as confirmed. Amber badge, amber timeline dot.",
          },
          {
            icon: CreditCard,
            tone: "text-signal",
            title: "Demo mode",
            body: "This preview has no live credentials, so integrations return realistic sample data through the same service layer real keys will use.",
          },
        ].map((item) => (
          <div key={item.title} className="glass rounded-2xl p-6">
            <item.icon className={`size-5 ${item.tone}`} />
            <h2 className="mt-4 font-display text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="glass-strong mt-8 rounded-2xl p-8">
        <h2 className="font-display text-xl font-semibold">Integrations</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-background/40 p-5 ring-1 ring-border/50">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-verified" />
              <h3 className="font-display font-semibold">Stripe</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Pulls MRR, paying customers and churn. Any revenue milestone posted while Stripe is
              connected is stamped verified automatically.
            </p>
          </div>
          <div className="rounded-xl bg-background/40 p-5 ring-1 ring-border/50">
            <div className="flex items-center gap-3">
              <GitBranch className="size-5 text-signal" />
              <h3 className="font-display font-semibold">GitHub</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Pulls releases, tags and commit volume so product and launch milestones can be
              confirmed against real ship activity.
            </p>
          </div>
        </div>
        <p className="mt-5 text-xs text-demo">
          Both run on demo data until live credentials are added. The connect flow, sync status and
          verification rules are already wired end to end.
        </p>
        <Button asChild variant="signal" className="mt-6">
          <Link to="/dashboard/integrations">Open integration settings</Link>
        </Button>
      </div>
    </SiteShell>
  );
}
