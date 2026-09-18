import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ExternalLink, GitBranch, Globe, MapPin } from "lucide-react";
import { toast } from "sonner";

import { DemoDataNote, LogoMark, VerifyBadge } from "@/components/brand";
import { SiteShell } from "@/components/site-shell";
import { MilestoneItem } from "@/components/milestone-item";
import { MetricTile } from "@/components/metric-tile";
import { ChartLegend, GrowthChart } from "@/components/growth-chart";
import { EmptyState, ErrorState, LoadingRows } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  getStartupBySlug,
  isFollowing,
  listIntegrations,
  listMetricPoints,
  listMilestones,
  toggleFollow,
} from "@/lib/api";
import { formatCurrency, formatNumber, formatPercent, relativeTime } from "@/lib/format";

export const Route = createFileRoute("/startups/$slug/")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — verified startup log on Signallog` },
      {
        name: "description",
        content: `Follow ${params.slug} on Signallog: verified MRR, active users, growth charts, product updates and the full milestone timeline.`,
      },
      { property: "og:title", content: `${params.slug} on Signallog` },
      {
        property: "og:description",
        content: "Verified MRR, users, growth and milestones in one public log.",
      },
    ],
  }),
  component: StartupProfile,
});

function StartupProfile() {
  const { slug } = Route.useParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const startupQuery = useQuery({
    queryKey: ["startup", slug],
    queryFn: () => getStartupBySlug(slug),
  });
  const startup = startupQuery.data;

  const milestones = useQuery({
    queryKey: ["milestones", "startup", startup?.id],
    queryFn: () => listMilestones({ startupId: startup!.id, limit: 50 }),
    enabled: !!startup,
  });
  const metrics = useQuery({
    queryKey: ["metrics", startup?.id],
    queryFn: () => listMetricPoints(startup!.id),
    enabled: !!startup,
  });
  const integrations = useQuery({
    queryKey: ["integrations", startup?.id],
    queryFn: () => listIntegrations(startup!.id),
    enabled: !!startup,
  });
  const following = useQuery({
    queryKey: ["following", startup?.id, user?.id],
    queryFn: () => isFollowing(startup!.id, user!.id),
    enabled: !!startup && !!user,
  });

  const follow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("sign-in-required");
      return toggleFollow(startup!.id, user.id, !!following.data);
    },
    onSuccess: (isNowFollowing) => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["startup", slug] });
      toast.success(isNowFollowing ? `Following ${startup?.name}` : "Unfollowed");
    },
    onError: (error: Error) =>
      toast.error(
        error.message === "sign-in-required" ? "Sign in to follow startups" : "Could not update",
      ),
  });

  if (startupQuery.isLoading) {
    return (
      <SiteShell>
        <div className="glass mt-10 h-64 animate-pulse rounded-2xl" />
      </SiteShell>
    );
  }

  if (startupQuery.isError) {
    return (
      <SiteShell>
        <div className="py-10">
          <ErrorState />
        </div>
      </SiteShell>
    );
  }

  if (!startup) {
    return (
      <SiteShell>
        <div className="py-16">
          <EmptyState
            title="Startup not found"
            description="This log doesn't exist or was removed."
            action={
              <Button asChild variant="signal">
                <Link to="/explore">Explore startups</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  const isOwner = !!profile && profile.id === startup.owner_id;
  const shipLogs = (milestones.data ?? []).filter(
    (item) => item.source === "github" || item.category === "product",
  );

  return (
    <SiteShell>
      <section className="glass-strong mt-8 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <LogoMark letter={startup.logo_letter} className="size-14 text-2xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight">
                  {startup.name}
                </h1>
                <VerifyBadge verified={startup.verified} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{startup.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="rounded-full bg-panel-raised px-2.5 py-1">{startup.category}</span>
                {startup.location ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {startup.location}
                  </span>
                ) : null}
                {startup.website ? (
                  <a
                    href={startup.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Globe className="size-3.5" /> Website <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:min-w-[220px]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Followers</span>
              <span className="num font-semibold">{formatNumber(startup.follower_count)}</span>
            </div>
            {isOwner ? (
              <Button asChild variant="outline">
                <Link to="/startups/$slug/edit" params={{ slug: startup.slug }}>
                  Edit startup
                </Link>
              </Button>
            ) : (
              <Button
                variant={following.data ? "outline" : "signal"}
                onClick={() => follow.mutate()}
                disabled={follow.isPending}
              >
                {following.data ? "Following" : "Follow startup"}
              </Button>
            )}
            <div className="space-y-2">
              {(integrations.data ?? []).map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2 text-xs ring-1 ring-border/50"
                >
                  <span className="flex items-center gap-2 capitalize text-foreground">
                    {integration.provider === "stripe" ? (
                      <CreditCard className="size-3.5" />
                    ) : (
                      <GitBranch className="size-3.5" />
                    )}
                    {integration.provider}
                  </span>
                  <span
                    className={`num ${integration.status === "connected" ? "text-verified" : "text-muted-foreground"}`}
                  >
                    {integration.status === "connected" ? "Connected" : "Not connected"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="MRR"
            value={formatCurrency(startup.mrr)}
            delta={formatPercent(Number(startup.growth))}
            tone={startup.verified ? "verified" : "demo"}
          />
          <MetricTile
            label="Active users"
            value={formatNumber(startup.active_users)}
            delta="monthly"
            tone="muted"
          />
          <MetricTile
            label="Growth"
            value={`${startup.growth}%`}
            delta="month over month"
            tone="muted"
          />
          <MetricTile
            label="Churn"
            value={`${startup.churn}%`}
            delta="trailing 30 days"
            tone="muted"
          />
        </div>
        {!startup.verified ? <DemoDataNote className="mt-4" /> : null}
      </section>

      <section className="glass mt-6 rounded-2xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold">MRR growth</h2>
            <p className="text-xs text-muted-foreground">
              Trailing 12 months ·{" "}
              {startup.verified ? "verified via Stripe" : "self-reported by the founder"}
            </p>
          </div>
          <ChartLegend />
        </div>
        <GrowthChart points={metrics.data ?? []} metric="mrr" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="ship">Product &amp; ship log</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4 space-y-4">
            {milestones.isLoading ? <LoadingRows count={3} /> : null}
            {milestones.data?.length === 0 ? (
              <EmptyState
                title="No milestones yet"
                description="This founder hasn't published an update on Signallog."
              />
            ) : null}
            {(milestones.data ?? []).map((milestone) => (
              <MilestoneItem key={milestone.id} milestone={milestone} showStartup={false} />
            ))}
          </TabsContent>

          <TabsContent value="ship" className="mt-4 space-y-4">
            {shipLogs.length === 0 ? (
              <EmptyState
                title="No ship log entries"
                description="Product and GitHub-verified milestones will show up here."
              />
            ) : (
              shipLogs.map((milestone) => (
                <MilestoneItem key={milestone.id} milestone={milestone} showStartup={false} />
              ))
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-4">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display font-semibold">About {startup.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {startup.description ?? startup.tagline}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <aside className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-sm font-semibold">Founder</h3>
            {startup.owner ? (
              <Link
                to="/founders/$handle"
                params={{ handle: startup.owner.handle }}
                className="mt-3 flex items-center gap-3"
              >
                <LogoMark
                  letter={startup.owner.display_name}
                  className="size-10 rounded-full text-sm"
                />
                <div>
                  <div className="text-sm font-medium">{startup.owner.display_name}</div>
                  <div className="num text-[11px] text-muted-foreground">
                    @{startup.owner.handle}
                  </div>
                </div>
              </Link>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Unclaimed page.</p>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-sm font-semibold">Integration status</h3>
            <div className="mt-3 space-y-2.5">
              {(integrations.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No integrations connected yet.</p>
              ) : null}
              {(integrations.data ?? []).map((integration) => (
                <div key={integration.id} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{integration.provider}</span>
                    <span className="num text-demo">{integration.mode}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Last sync {relativeTime(integration.last_synced_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </SiteShell>
  );
}
