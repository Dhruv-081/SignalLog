import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeading, SiteShell } from "@/components/site-shell";
import { LogoMark, VerifyBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getStartupBySlug,
  updateStartup,
  deleteStartup,
  type Startup,
} from "@/lib/api";
import { STARTUP_CATEGORIES, formatCurrency, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/startups/$slug/edit")({
  head: ({ params }) => ({
    meta: [
      { title: `Edit ${params.slug} — Signallog` },
    ],
  }),
  component: EditStartupPage,
});

const STAGES = ["Bootstrapped", "Pre-seed", "Seed", "Series A", "Profitable", "Idea"];
const TEAM_SIZES = ["Solo Founder", "2-5 people", "6-10 people", "11-50 people", "50+ people"];
const TARGET_MARKETS = ["B2B", "B2C", "DevTools", "Enterprise", "Marketplace", "SMB"];

function EditStartupPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const startupQuery = useQuery({
    queryKey: ["startup", slug],
    queryFn: () => getStartupBySlug(slug),
  });
  const startup = startupQuery.data;

  const [form, setForm] = useState<Partial<Startup>>({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    category: "SaaS",
    logo_letter: "",
    website: "",
    location: "",
    mrr: 0,
    active_users: 0,
    growth: 0,
    churn: 0,
    verified: false,
    stage: "Bootstrapped",
    team_size: "Solo Founder",
    target_market: "B2B",
    tech_stack: "",
    demo_url: "",
  });

  useEffect(() => {
    if (startup) {
      setForm({
        name: startup.name,
        slug: startup.slug,
        tagline: startup.tagline,
        description: startup.description || "",
        category: startup.category,
        logo_letter: startup.logo_letter,
        website: startup.website || "",
        location: startup.location || "",
        mrr: startup.mrr,
        active_users: startup.active_users,
        growth: startup.growth,
        churn: startup.churn,
        verified: startup.verified,
        stage: startup.stage || "Bootstrapped",
        team_size: startup.team_size || "Solo Founder",
        target_market: startup.target_market || "B2B",
        tech_stack: startup.tech_stack || "",
        demo_url: startup.demo_url || "",
      });
    }
  }, [startup]);

  const updateMutation = useMutation({
    mutationFn: async (updated: Partial<Startup>) => {
      if (!startup) return;
      return await updateStartup(startup.id, updated);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["startup"] });
      queryClient.invalidateQueries({ queryKey: ["my-startups"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      toast.success("Startup updated successfully!");
      if (saved.slug !== slug) {
        navigate({ to: "/startups/$slug", params: { slug: saved.slug } });
      }
    },
    onError: () => toast.error("Failed to update startup."),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!startup) return;
      return await deleteStartup(startup.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-startups"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      toast.success("Startup deleted.");
      navigate({ to: "/dashboard" });
    },
  });

  if (startupQuery.isLoading) {
    return (
      <SiteShell>
        <div className="py-12">
          <div className="glass h-64 animate-pulse rounded-2xl" />
        </div>
      </SiteShell>
    );
  }

  if (!startup) {
    return (
      <SiteShell>
        <div className="py-12 text-center">
          <h2 className="font-display text-2xl font-bold">Startup not found</h2>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Link to="/dashboard">
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        <PageHeading
          eyebrow="startup configuration"
          title={`Edit ${startup.name}`}
          description="Update telemetry values, product categorization, and expanded market details."
        />

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(form);
            }}
            className="glass rounded-3xl p-6 sm:p-8 space-y-6 border border-border/70"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="e_name" className="text-xs">Startup Name</Label>
                <Input
                  id="e_name"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="e_slug" className="text-xs">URL Slug</Label>
                <Input
                  id="e_slug"
                  value={form.slug || ""}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="e_tagline" className="text-xs">Tagline</Label>
              <Input
                id="e_tagline"
                value={form.tagline || ""}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="e_desc" className="text-xs">Full Description</Label>
              <Textarea
                id="e_desc"
                rows={3}
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="e_cat" className="text-xs">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm({ ...form, category: val })}
                >
                  <SelectTrigger id="e_cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    {STARTUP_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="e_stage" className="text-xs">Stage / Funding</Label>
                <Select
                  value={form.stage || "Bootstrapped"}
                  onValueChange={(val) => setForm({ ...form, stage: val })}
                >
                  <SelectTrigger id="e_stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    {STAGES.map((stg) => (
                      <SelectItem key={stg} value={stg}>{stg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="e_team" className="text-xs">Team Size</Label>
                <Select
                  value={form.team_size || "Solo Founder"}
                  onValueChange={(val) => setForm({ ...form, team_size: val })}
                >
                  <SelectTrigger id="e_team">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    {TEAM_SIZES.map((ts) => (
                      <SelectItem key={ts} value={ts}>{ts}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="e_mrr" className="text-xs">MRR ($ USD)</Label>
                <Input
                  id="e_mrr"
                  type="number"
                  value={form.mrr}
                  onChange={(e) => setForm({ ...form, mrr: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="e_users" className="text-xs">Users</Label>
                <Input
                  id="e_users"
                  type="number"
                  value={form.active_users}
                  onChange={(e) => setForm({ ...form, active_users: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="e_growth" className="text-xs">Growth (%)</Label>
                <Input
                  id="e_growth"
                  type="number"
                  step="0.1"
                  value={form.growth}
                  onChange={(e) => setForm({ ...form, growth: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="e_churn" className="text-xs">Churn (%)</Label>
                <Input
                  id="e_churn"
                  type="number"
                  step="0.1"
                  value={form.churn}
                  onChange={(e) => setForm({ ...form, churn: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="e_target" className="text-xs">Target Market</Label>
                <Select
                  value={form.target_market || "B2B"}
                  onValueChange={(val) => setForm({ ...form, target_market: val })}
                >
                  <SelectTrigger id="e_target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    {TARGET_MARKETS.map((tm) => (
                      <SelectItem key={tm} value={tm}>{tm}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="e_stack" className="text-xs">Tech Stack</Label>
                <Input
                  id="e_stack"
                  value={form.tech_stack || ""}
                  onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="e_web" className="text-xs">Website URL</Label>
                <Input
                  id="e_web"
                  value={form.website || ""}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="e_demo" className="text-xs">Demo / Sandbox URL</Label>
                <Input
                  id="e_demo"
                  value={form.demo_url || ""}
                  onChange={(e) => setForm({ ...form, demo_url: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-panel-raised/50 p-3.5 border border-border/60">
              <div>
                <div className="text-xs font-semibold text-foreground">Verified Countersigned Status</div>
                <div className="text-[11px] text-muted-foreground">Confirm verified telemetry proof.</div>
              </div>
              <Switch
                checked={form.verified}
                onCheckedChange={(checked) => setForm({ ...form, verified: checked })}
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-4">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete ${startup.name}?`)) {
                    deleteMutation.mutate();
                  }
                }}
                className="gap-1.5"
              >
                <Trash2 className="size-3.5" />
                Delete Startup
              </Button>

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/startups/$slug" params={{ slug: startup.slug }}>
                    Cancel
                  </Link>
                </Button>
                <Button
                  type="submit"
                  variant="signal"
                  size="sm"
                  disabled={updateMutation.isPending}
                  className="gap-1.5"
                >
                  <Save className="size-3.5" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>

          {/* Live Card Preview */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live Preview
            </div>

            <div className="glass rounded-3xl p-6 border border-border/70 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <LogoMark letter={form.logo_letter || form.name?.charAt(0) || "S"} className="size-12 text-lg" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-lg font-bold text-foreground">
                        {form.name || "Startup Name"}
                      </span>
                      <VerifyBadge verified={form.verified} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {form.category} · {form.stage} · {form.team_size}
                    </div>
                  </div>
                </div>
                <span className="num rounded-full bg-panel-raised border border-border/60 px-2.5 py-1 text-xs text-signal font-semibold">
                  +{form.growth}% MRR
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {form.tagline || "Your startup tagline will appear here."}
              </p>

              <div className="grid grid-cols-3 gap-2 rounded-xl bg-panel-raised/40 p-3 border border-border/50 text-center">
                <div>
                  <span className="text-[10px] text-muted-foreground block">MRR</span>
                  <span className="num text-xs font-bold text-foreground">
                    {formatCurrency(form.mrr || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Users</span>
                  <span className="num text-xs font-bold text-foreground">
                    {formatNumber(form.active_users || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Target</span>
                  <span className="text-xs font-bold text-foreground">
                    {form.target_market}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
