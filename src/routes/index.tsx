import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, GitBranch, LineChart, Radio } from "lucide-react";

import { LogoMark, VerifyBadge } from "@/components/brand";
import { SiteShell } from "@/components/site-shell";
import { StartupCard, StartupCardSkeleton } from "@/components/startup-card";
import { MilestoneItem } from "@/components/milestone-item";
import { LoadingRows } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { listMilestones, listStartups, platformStats } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Signallog — every founder milestone, stamped and countersigned" },
      {
        name: "description",
        content:
          "A build-in-public hub where founders publish MRR, users and ship logs, and Stripe or GitHub verify them on the spot.",
      },
      { property: "og:title", content: "Signallog — verified build-in-public hub" },
      {
        property: "og:description",
        content: "Founders publish verified milestones. Investors follow the receipts.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const startups = useQuery({ queryKey: ["startups", "featured"], queryFn: () => listStartups({}) });
  const milestones = useQuery({
    queryKey: ["milestones", "latest"],
    queryFn: () => listMilestones({ limit: 4 }),
  });
  const stats = useQuery({ queryKey: ["platform-stats"], queryFn: platformStats });

  const featured = (startups.data ?? []).slice(0, 3);
  const spotlight = (startups.data ?? [])[0];

  return (
    <SiteShell>
      {/* HERO */}
      <section className="py-14 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="animate-rise">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-panel/60 px-3 py-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-verified" /> Live-verified revenue, users
              &amp; ship logs
            </div>
            <h1 className="font-display text-4xl font-semibold leading-none tracking-tight text-balance sm:text-5xl xl:text-6xl">
              Every founder milestone, <span className="text-signal">stamped</span> and
              countersigned.
            </h1>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
              Signallog is a build-in-public hub where founders publish raw numbers and Stripe +
              GitHub verify them on the spot. Followers track the receipts, not the pitch deck.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="signal" size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start a public log
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/explore">Browse startups</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-border/60 pt-6">
              <div>
                <div className="num text-2xl font-bold">
                  {formatNumber(stats.data?.startupCount ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground">public startups</div>
              </div>
              <div>
                <div className="num text-2xl font-bold">
                  {formatCurrency(stats.data?.totalMrr ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground">MRR tracked</div>
              </div>
              <div>
                <div className="num text-2xl font-bold">{stats.data?.verifiedShare ?? 0}%</div>
                <div className="text-xs text-muted-foreground">milestones verified</div>
              </div>
            </div>
          </div>

          {/* floating spotlight panel */}
          <div className="relative">
            {spotlight ? (
              <div className="glass-strong animate-floaty relative overflow-hidden rounded-2xl p-6">
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <LogoMark letter={spotlight.logo_letter} className="size-11 text-lg" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-lg font-semibold">{spotlight.name}</span>
                        <VerifyBadge verified={spotlight.verified} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {spotlight.category} · {formatNumber(spotlight.follower_count)} followers
                      </div>
                    </div>
                  </div>
                  <span className="num rounded-full bg-panel-raised px-2.5 py-1 text-[11px] text-muted-foreground">
                    +{spotlight.growth}% MRR
                  </span>
                </div>

                <div className="relative mt-5 flex items-end justify-between gap-2">
                  <div className="flex items-end gap-1" style={{ height: 44 }}>
                    {[22, 30, 26, 44, 52, 66, 82, 100].map((height, index) => (
                      <span
                        key={index}
                        className="w-2 rounded-sm bg-signal"
                        style={{ height: `${height}%`, opacity: 0.3 + index * 0.09 }}
                      />
                    ))}
                  </div>
                  <span className="num text-xs text-muted-foreground">last 8 wks</span>
                </div>

                <div className="relative mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: "MRR", value: formatCurrency(spotlight.mrr) },
                    { label: "Users", value: formatNumber(spotlight.active_users) },
                    { label: "Growth", value: `+${spotlight.growth}%` },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-xl bg-background/40 p-3 ring-1 ring-border/50"
                    >
                      <div className="text-[11px] text-muted-foreground">{metric.label}</div>
                      <div className="num text-lg font-bold">{metric.value}</div>
                    </div>
                  ))}
                </div>

                <div className="relative mt-5 space-y-2.5">
                  {(milestones.data ?? []).slice(0, 3).map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-2.5 text-xs">
                      <span
                        className={`size-1.5 shrink-0 rounded-full ${milestone.verified ? "bg-verified" : "bg-demo"}`}
                      />
                      <span className="truncate text-foreground">{milestone.title}</span>
                      <VerifyBadge verified={milestone.verified} className="ml-auto shrink-0" />
                    </div>
                  ))}
                </div>

                <Button asChild variant="outline" size="sm" className="relative mt-5 w-full">
                  <Link to="/startups/$slug" params={{ slug: spotlight.slug }}>
                    Open {spotlight.name}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="glass h-[420px] animate-pulse rounded-2xl" />
            )}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Featured this week
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Highest-verified momentum across the hub.
            </p>
          </div>
          <Link to="/explore" className="text-sm font-medium text-signal">
            View all →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {startups.isLoading
            ? Array.from({ length: 3 }).map((_, index) => <StartupCardSkeleton key={index} />)
            : featured.map((startup) => <StartupCard key={startup.id} startup={startup} />)}
        </div>
      </section>

      {/* LATEST MILESTONES */}
      <section className="py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Latest milestones
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fresh entries from founder logs, verified where the integration allows it.
            </p>
          </div>
          <Link to="/milestones" className="text-sm font-medium text-signal">
            Full timeline →
          </Link>
        </div>
        {milestones.isLoading ? (
          <LoadingRows count={3} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {(milestones.data ?? []).map((milestone) => (
              <MilestoneItem key={milestone.id} milestone={milestone} />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: Radio,
              title: "Claim your startup page",
              body: "Name, tagline, category and website. Two minutes, no pitch deck.",
            },
            {
              step: "02",
              icon: GitBranch,
              title: "Connect Stripe or GitHub",
              body: "Revenue and ship logs sync in. Anything unconnected stays clearly self-reported.",
            },
            {
              step: "03",
              icon: LineChart,
              title: "Post milestones, grow followers",
              body: "Each entry lands on your public timeline with a verification stamp and a chart.",
            },
          ].map((item) => (
            <div key={item.step} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <item.icon className="size-5 text-signal" />
                <span className="num text-xs text-muted-foreground">{item.step}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VERIFICATION */}
      <section className="py-10">
        <div className="glass-strong grid gap-8 rounded-2xl p-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Verification, not vibes
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Connected sources stamp a milestone green. Everything else is labelled self-reported —
              no silent mixing of the two. In this preview, integrations run on demo data behind the
              same interface real credentials will use.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-6">
              <Link to="/verification">How verification works</Link>
            </Button>
          </div>
          <div className="space-y-2.5">
            {[
              { name: "Stripe", detail: "MRR, churn and paying customers", state: "Demo mode" },
              { name: "GitHub", detail: "Releases, tags and ship logs", state: "Demo mode" },
              { name: "Manual", detail: "Anything you type yourself", state: "Self-reported" },
            ].map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-xl bg-background/40 p-3 ring-1 ring-border/50"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-verified" />
                  <div>
                    <div className="text-sm font-medium">{row.name}</div>
                    <div className="text-[11px] text-muted-foreground">{row.detail}</div>
                  </div>
                </div>
                <span className="num text-[11px] text-demo">{row.state}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          What founders say
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            {
              quote:
                "Posting verified MRR killed every \"can you share numbers?\" email. I just send the link.",
              name: "Maya Okonjo",
              role: "Northbeam",
            },
            {
              quote:
                "The green stamp is the whole product. Nobody argues with a Stripe-verified milestone.",
              name: "Devin Ash",
              role: "Lumenstack",
            },
            {
              quote:
                "We published a bad month and got three intros out of it. Honesty compounds here.",
              name: "Sana Iqbal",
              role: "Hearthmail",
            },
          ].map((item) => (
            <figure key={item.name} className="glass rounded-2xl p-6">
              <blockquote className="text-sm leading-relaxed text-foreground">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-4 text-xs text-muted-foreground">
                {item.name} · {item.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="glass-strong flex flex-wrap items-center justify-between gap-6 rounded-2xl p-8">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Start your public log today
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Free while you're building. Verified from your first milestone.
            </p>
          </div>
          <Button asChild variant="signal" size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create your startup page
            </Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
