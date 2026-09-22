import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  DollarSign,
  Edit,
  ExternalLink,
  GitBranch,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeading, SiteShell } from "@/components/site-shell";
import { LogoMark, VerifyBadge } from "@/components/brand";
import { MilestoneItem } from "@/components/milestone-item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  listMyStartups,
  listMilestones,
  createStartup,
  updateStartup,
  deleteStartup,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  updateProfile,
  type Startup,
  type Milestone,
  type Profile,
  type StartupWithOwner,
  type MilestoneWithStartup,
} from "@/lib/api";
import { formatCurrency, formatNumber, MILESTONE_CATEGORIES, STARTUP_CATEGORIES } from "@/lib/format";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Founder Dashboard — Signallog" },
      { name: "description", content: "Manage your startups, milestones, and telemetry logs." },
    ],
  }),
  component: Dashboard,
});

const STAGES = ["Bootstrapped", "Pre-seed", "Seed", "Series A", "Profitable", "Idea"];
const TEAM_SIZES = ["Solo Founder", "2-5 people", "6-10 people", "11-50 people", "50+ people"];
const TARGET_MARKETS = ["B2B", "B2C", "DevTools", "Enterprise", "Marketplace", "SMB"];

function Dashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Queries
  const startupsQuery = useQuery({
    queryKey: ["my-startups", profile?.id],
    queryFn: () => listMyStartups(profile?.id),
  });
  const startups = startupsQuery.data ?? [];

  const milestonesQuery = useQuery({
    queryKey: ["my-milestones", startups.map((s) => s.id).join(",")],
    queryFn: async () => {
      const all = await listMilestones({ limit: 100 });
      const startupIds = new Set(startups.map((s) => s.id));
      return all.filter((m) => startupIds.has(m.startup_id));
    },
    enabled: startups.length > 0,
  });
  const milestones = milestonesQuery.data ?? [];

  // Aggregates
  const totalMrr = startups.reduce((acc, s) => acc + (s.mrr || 0), 0);
  const totalUsers = startups.reduce((acc, s) => acc + (s.active_users || 0), 0);
  const avgGrowth =
    startups.length > 0
      ? Math.round(
          (startups.reduce((acc, s) => acc + (s.growth || 0), 0) / startups.length) * 10,
        ) / 10
      : 0;

  // Dialog States
  const [isAddStartupOpen, setIsAddStartupOpen] = useState(false);
  const [isEditStartupOpen, setIsEditStartupOpen] = useState(false);
  const [editingStartup, setEditingStartup] = useState<StartupWithOwner | null>(null);

  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [isEditMilestoneOpen, setIsEditMilestoneOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneWithStartup | null>(null);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<Profile>>({});

  // Startup Form State
  const [startupForm, setStartupForm] = useState<Partial<Startup>>({
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

  // Milestone Form State
  const [milestoneForm, setMilestoneForm] = useState<Partial<Milestone>>({
    startup_id: "",
    title: "",
    description: "",
    category: "product",
    metric_label: "",
    metric_value: "",
    link_url: "",
    verified: false,
    occurred_at: new Date().toISOString().split("T")[0],
  });

  // Mutations
  const createStartupMutation = useMutation({
    mutationFn: async (payload: Partial<Startup> & { name: string; category: string }) => {
      return await createStartup(payload);
    },
    onSuccess: (newStartup) => {
      queryClient.invalidateQueries({ queryKey: ["my-startups"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      toast.success(`Startup "${newStartup.name}" created successfully!`);
      setIsAddStartupOpen(false);
    },
    onError: () => toast.error("Failed to create startup."),
  });

  const updateStartupMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Startup> }) => {
      return await updateStartup(id, updates);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["my-startups"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      toast.success(`Startup "${updated.name}" updated!`);
      setIsEditStartupOpen(false);
    },
    onError: () => toast.error("Failed to update startup."),
  });

  const deleteStartupMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteStartup(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-startups"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      toast.success("Startup deleted.");
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (payload: Partial<Milestone> & { title: string; startup_id: string }) => {
      return await createMilestone(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      toast.success("Milestone stamped and logged!");
      setIsAddMilestoneOpen(false);
    },
    onError: () => toast.error("Failed to create milestone."),
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Milestone> }) => {
      return await updateMilestone(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      toast.success("Milestone updated!");
      setIsEditMilestoneOpen(false);
    },
    onError: () => toast.error("Failed to update milestone."),
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteMilestone(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      toast.success("Milestone removed.");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updated: Partial<Profile>) => {
      return await updateProfile(profile?.id || "1", updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["founder-profile"] });
      toast.success("Profile updated!");
      setIsEditProfileOpen(false);
    },
  });

  // Open Handlers
  const handleOpenAddStartup = () => {
    setStartupForm({
      name: "",
      slug: "",
      tagline: "",
      description: "",
      category: "SaaS",
      logo_letter: "",
      website: "",
      location: profile?.location || "",
      mrr: 0,
      active_users: 0,
      growth: 0,
      churn: 0,
      verified: true,
      stage: "Bootstrapped",
      team_size: "Solo Founder",
      target_market: "B2B",
      tech_stack: "",
      demo_url: "",
    });
    setIsAddStartupOpen(true);
  };

  const handleOpenEditStartup = (startup: StartupWithOwner) => {
    setEditingStartup(startup);
    setStartupForm({
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
    setIsEditStartupOpen(true);
  };

  const handleOpenAddMilestone = (preselectedStartupId?: string) => {
    const targetId = preselectedStartupId || startups[0]?.id || "";
    setMilestoneForm({
      startup_id: targetId,
      title: "",
      description: "",
      category: "revenue",
      metric_label: "MRR",
      metric_value: "",
      link_url: "",
      verified: true,
      occurred_at: new Date().toISOString().split("T")[0],
    });
    setIsAddMilestoneOpen(true);
  };

  const handleOpenEditMilestone = (m: MilestoneWithStartup) => {
    setEditingMilestone(m);
    setMilestoneForm({
      startup_id: m.startup_id,
      title: m.title,
      description: m.description || "",
      category: m.category,
      metric_label: m.metric_label || "",
      metric_value: m.metric_value || "",
      link_url: m.link_url || "",
      verified: m.verified,
      occurred_at: m.occurred_at,
    });
    setIsEditMilestoneOpen(true);
  };

  const handleOpenEditProfile = () => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name,
        handle: profile.handle,
        headline: profile.headline || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
        location: profile.location || "",
        website: profile.website || "",
        twitter: profile.twitter || "",
        github: profile.github || "",
        linkedin: profile.linkedin || "",
        email: profile.email || "",
        skills: profile.skills || "",
      });
    }
    setIsEditProfileOpen(true);
  };

  return (
    <SiteShell>
      <div className="py-8 space-y-8">
        {/* DASHBOARD HEADER & PROFILE SUMMARY */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-signal">
              <Sparkles className="size-3.5" />
              Founder Control Console
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl mt-1">
              Founder Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Publish verified MRR receipts, ship updates, and manage your portfolio startups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="signal"
              onClick={handleOpenAddStartup}
              className="gap-2 shadow-sm"
            >
              <Plus className="size-4" />
              Add Startup
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenAddMilestone()}
              disabled={startups.length === 0}
              className="gap-2"
            >
              <Sparkles className="size-4 text-signal" />
              Log Milestone
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/integrations">
                Integrations
              </Link>
            </Button>
          </div>
        </div>

        {/* FOUNDER PROFILE QUICK CARD */}
        {profile && (
          <div className="glass relative overflow-hidden rounded-2xl p-5 border border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="size-14 rounded-xl border border-signal/40 object-cover shadow"
                />
              ) : (
                <div className="gradient-signal grid size-14 place-items-center rounded-xl font-display text-lg font-bold text-primary-foreground shadow">
                  {profile.display_name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold text-foreground">
                    {profile.display_name}
                  </span>
                  <span className="text-xs text-muted-foreground">@{profile.handle}</span>
                  <VerifyBadge verified={true} />
                </div>
                {profile.headline && (
                  <p className="text-xs text-signal font-medium mt-0.5 line-clamp-1">
                    {profile.headline}
                  </p>
                )}
                {profile.location && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3" />
                    {profile.location}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditProfile}
                className="h-8 text-xs gap-1.5"
              >
                <Edit className="size-3.5 text-signal" />
                Edit Profile
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
                <Link to="/founders/$handle" params={{ handle: profile.handle }}>
                  View Profile <ArrowUpRight className="size-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* EXECUTIVE METRICS STRIP */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="glass rounded-2xl p-5 border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Portfolio MRR</span>
              <DollarSign className="size-4 text-verified" />
            </div>
            <div className="num mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              {formatCurrency(totalMrr)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">across {startups.length} startups</div>
          </div>

          <div className="glass rounded-2xl p-5 border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Active Users</span>
              <Users className="size-4 text-signal" />
            </div>
            <div className="num mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              {formatNumber(totalUsers)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">verified user base</div>
          </div>

          <div className="glass rounded-2xl p-5 border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg Monthly Growth</span>
              <TrendingUp className="size-4 text-signal" />
            </div>
            <div className="num mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              +{avgGrowth}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">month over month</div>
          </div>

          <div className="glass rounded-2xl p-5 border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Milestones Logged</span>
              <Sparkles className="size-4 text-signal" />
            </div>
            <div className="num mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              {milestones.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">verified ship events</div>
          </div>
        </div>

        {/* TABS: STARTUPS & MILESTONES */}
        <Tabs defaultValue="startups" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="bg-panel border border-border/60">
              <TabsTrigger value="startups" className="gap-2">
                <Building2 className="size-4" />
                Your Startups ({startups.length})
              </TabsTrigger>
              <TabsTrigger value="milestones" className="gap-2">
                <Sparkles className="size-4" />
                Milestones ({milestones.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddStartup}
                className="gap-1 text-xs"
              >
                <Plus className="size-3.5 text-signal" />
                Add Startup
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAddMilestone()}
                disabled={startups.length === 0}
                className="gap-1 text-xs"
              >
                <Sparkles className="size-3.5 text-signal" />
                Log Milestone
              </Button>
            </div>
          </div>

          {/* STARTUPS TAB CONTENT */}
          <TabsContent value="startups" className="space-y-6">
            {startups.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Building2 className="mx-auto size-12 text-signal/50 mb-3" />
                <h3 className="font-display text-lg font-bold text-foreground">No startups added yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                  Add your first startup project to begin tracking verified revenue, users, and milestone proofs.
                </p>
                <Button
                  variant="signal"
                  size="sm"
                  onClick={handleOpenAddStartup}
                  className="mt-5 gap-2"
                >
                  <Plus className="size-4" />
                  Create Your First Startup
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {startups.map((s) => (
                  <div
                    key={s.id}
                    className="glass lift relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 border border-border/70"
                  >
                    <div>
                      {/* Top bar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <LogoMark letter={s.logo_letter} className="size-12 text-xl" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Link
                                to="/startups/$slug"
                                params={{ slug: s.slug }}
                                className="font-display text-lg font-bold hover:text-signal transition-colors"
                              >
                                {s.name}
                              </Link>
                              <VerifyBadge verified={s.verified} />
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 mt-0.5">
                              <span>{s.category}</span>
                              {s.stage && <span>· {s.stage}</span>}
                              {s.team_size && <span>· {s.team_size}</span>}
                            </div>
                          </div>
                        </div>

                        <span className="num rounded-full bg-panel-raised border border-border/60 px-2.5 py-1 text-xs text-signal font-semibold">
                          +{s.growth}% MRR
                        </span>
                      </div>

                      {/* Tagline */}
                      <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                        {s.tagline}
                      </p>

                      {/* New fields: Target market & tech stack badges */}
                      {(s.target_market || s.tech_stack || s.demo_url) && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1">
                          {s.target_market && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/70">
                              {s.target_market}
                            </Badge>
                          )}
                          {s.tech_stack &&
                            s.tech_stack
                              .split(",")
                              .slice(0, 3)
                              .map((t, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="bg-panel-raised text-[10px] text-muted-foreground"
                                >
                                  {t.trim()}
                                </Badge>
                              ))}
                          {s.demo_url && (
                            <a
                              href={s.demo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-signal hover:underline flex items-center gap-0.5"
                            >
                              Demo <ExternalLink className="size-2.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Numbers grid */}
                      <div className="mt-5 grid grid-cols-4 gap-2 rounded-xl bg-panel-raised/40 p-3 border border-border/50 text-center">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">MRR</span>
                          <span className="num text-xs font-bold text-foreground">
                            {formatCurrency(s.mrr)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Users</span>
                          <span className="num text-xs font-bold text-foreground">
                            {formatNumber(s.active_users)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Churn</span>
                          <span className="num text-xs font-bold text-foreground">
                            {s.churn}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Followers</span>
                          <span className="num text-xs font-bold text-foreground">
                            {s.follower_count}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditStartup(s)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Edit className="size-3.5 text-signal" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAddMilestone(s.id)}
                          className="h-8 text-xs gap-1 text-signal hover:text-signal"
                        >
                          <Sparkles className="size-3.5" />
                          + Milestone
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                          <Link to="/startups/$slug" params={{ slug: s.slug }}>
                            Public Page
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${s.name}?`)) {
                              deleteStartupMutation.mutate(s.id);
                            }
                          }}
                          className="size-8 text-muted-foreground hover:text-destructive"
                          aria-label="Delete startup"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* MILESTONES TAB CONTENT */}
          <TabsContent value="milestones" className="space-y-4">
            {milestones.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Sparkles className="mx-auto size-12 text-signal/50 mb-3" />
                <h3 className="font-display text-lg font-bold text-foreground">No milestones logged yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                  Stamp your first verified revenue jump, active user milestone, or major product release.
                </p>
                <Button
                  variant="signal"
                  size="sm"
                  onClick={() => handleOpenAddMilestone()}
                  disabled={startups.length === 0}
                  className="mt-5 gap-2"
                >
                  <Plus className="size-4" />
                  Log Your First Milestone
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="glass rounded-2xl p-5 border border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold text-foreground">
                          {m.title}
                        </span>
                        {m.metric_value && (
                          <span className="num rounded-full bg-signal/15 text-signal border border-signal/30 px-2 py-0.5 text-xs font-bold">
                            {m.metric_label ? `${m.metric_label}: ` : ""}
                            {m.metric_value}
                          </span>
                        )}
                        <VerifyBadge verified={m.verified} />
                        <span className="rounded-md bg-panel-raised px-2 py-0.5 text-[11px] text-muted-foreground uppercase tracking-wide">
                          {m.category}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-2xl">
                          {m.description}
                        </p>
                      )}
                      <div className="text-[11px] text-muted-foreground flex items-center gap-3 pt-1">
                        {m.startup && <span>Startup: <strong>{m.startup.name}</strong></span>}
                        <span>Occurred: {m.occurred_at}</span>
                        {m.link_url && (
                          <a
                            href={m.link_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-signal hover:underline flex items-center gap-0.5"
                          >
                            Proof Link <ExternalLink className="size-2.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditMilestone(m)}
                        className="h-8 text-xs gap-1"
                      >
                        <Edit className="size-3 text-signal" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this milestone?")) {
                            deleteMilestoneMutation.mutate(m.id);
                          }
                        }}
                        className="size-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG: ADD STARTUP */}
      {/* ========================================================================= */}
      <Dialog open={isAddStartupOpen} onOpenChange={setIsAddStartupOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add New Startup</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a new public startup log to track revenue, users, and milestone receipts.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!startupForm.name) return;
              createStartupMutation.mutate(startupForm as any);
            }}
            className="space-y-4 py-2"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="as_name" className="text-xs">Startup Name *</Label>
                <Input
                  id="as_name"
                  value={startupForm.name || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    setStartupForm({
                      ...startupForm,
                      name,
                      slug: startupForm.slug ? startupForm.slug : autoSlug,
                      logo_letter: name.charAt(0).toUpperCase() || "S",
                    });
                  }}
                  placeholder="e.g. Acme Cloud"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="as_slug" className="text-xs">URL Slug *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">/startups/</span>
                  <Input
                    id="as_slug"
                    className="pl-20"
                    value={startupForm.slug || ""}
                    onChange={(e) => setStartupForm({ ...startupForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="acme-cloud"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as_tagline" className="text-xs">Tagline *</Label>
              <Input
                id="as_tagline"
                value={startupForm.tagline || ""}
                onChange={(e) => setStartupForm({ ...startupForm, tagline: e.target.value })}
                placeholder="One sentence describing what your product does."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as_desc" className="text-xs">Full Description</Label>
              <Textarea
                id="as_desc"
                rows={2}
                value={startupForm.description || ""}
                onChange={(e) => setStartupForm({ ...startupForm, description: e.target.value })}
                placeholder="What problem do you solve? How does your tech work?"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="as_cat" className="text-xs">Category</Label>
                <Select
                  value={startupForm.category}
                  onValueChange={(val) => setStartupForm({ ...startupForm, category: val })}
                >
                  <SelectTrigger id="as_cat">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    {STARTUP_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="as_stage" className="text-xs">Funding / Stage</Label>
                <Select
                  value={startupForm.stage || "Bootstrapped"}
                  onValueChange={(val) => setStartupForm({ ...startupForm, stage: val })}
                >
                  <SelectTrigger id="as_stage">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    {STAGES.map((stg) => (
                      <SelectItem key={stg} value={stg}>{stg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="as_team" className="text-xs">Team Size</Label>
                <Select
                  value={startupForm.team_size || "Solo Founder"}
                  onValueChange={(val) => setStartupForm({ ...startupForm, team_size: val })}
                >
                  <SelectTrigger id="as_team">
                    <SelectValue placeholder="Team Size" />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    {TEAM_SIZES.map((ts) => (
                      <SelectItem key={ts} value={ts}>{ts}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="as_mrr" className="text-xs">MRR ($ USD)</Label>
                <Input
                  id="as_mrr"
                  type="number"
                  min="0"
                  value={startupForm.mrr}
                  onChange={(e) => setStartupForm({ ...startupForm, mrr: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="as_users" className="text-xs">Active Users</Label>
                <Input
                  id="as_users"
                  type="number"
                  min="0"
                  value={startupForm.active_users}
                  onChange={(e) => setStartupForm({ ...startupForm, active_users: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="as_growth" className="text-xs">Growth MoM (%)</Label>
                <Input
                  id="as_growth"
                  type="number"
                  step="0.1"
                  value={startupForm.growth}
                  onChange={(e) => setStartupForm({ ...startupForm, growth: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="as_churn" className="text-xs">Churn (%)</Label>
                <Input
                  id="as_churn"
                  type="number"
                  step="0.1"
                  value={startupForm.churn}
                  onChange={(e) => setStartupForm({ ...startupForm, churn: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Extended fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="as_target" className="text-xs">Target Market</Label>
                <Select
                  value={startupForm.target_market || "B2B"}
                  onValueChange={(val) => setStartupForm({ ...startupForm, target_market: val })}
                >
                  <SelectTrigger id="as_target">
                    <SelectValue placeholder="Select Market" />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    {TARGET_MARKETS.map((tm) => (
                      <SelectItem key={tm} value={tm}>{tm}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="as_stack" className="text-xs">Tech Stack (comma separated)</Label>
                <Input
                  id="as_stack"
                  value={startupForm.tech_stack || ""}
                  onChange={(e) => setStartupForm({ ...startupForm, tech_stack: e.target.value })}
                  placeholder="e.g. Next.js, TypeScript, PostgreSQL, AI"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="as_web" className="text-xs">Website URL</Label>
                <Input
                  id="as_web"
                  value={startupForm.website || ""}
                  onChange={(e) => setStartupForm({ ...startupForm, website: e.target.value })}
                  placeholder="https://yourstartup.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="as_demo" className="text-xs">Demo / Sandbox Link</Label>
                <Input
                  id="as_demo"
                  value={startupForm.demo_url || ""}
                  onChange={(e) => setStartupForm({ ...startupForm, demo_url: e.target.value })}
                  placeholder="https://demo.yourstartup.com"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-panel-raised/50 p-3 border border-border/60">
              <div>
                <div className="text-xs font-semibold text-foreground">Verified Founder Receipt</div>
                <div className="text-[11px] text-muted-foreground">Mark metrics as verified by Stripe or GitHub proof.</div>
              </div>
              <Switch
                checked={startupForm.verified}
                onCheckedChange={(checked) => setStartupForm({ ...startupForm, verified: checked })}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setIsAddStartupOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="signal" disabled={createStartupMutation.isPending}>
                {createStartupMutation.isPending ? "Creating..." : "Create Startup"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: EDIT STARTUP */}
      {/* ========================================================================= */}
      <Dialog open={isEditStartupOpen} onOpenChange={setIsEditStartupOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Startup: {editingStartup?.name}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update startup parameters, telemetry numbers, and new custom metadata fields.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingStartup) return;
              updateStartupMutation.mutate({ id: editingStartup.id, updates: startupForm });
            }}
            className="space-y-4 py-2"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="es_name" className="text-xs">Startup Name</Label>
                <Input
                  id="es_name"
                  value={startupForm.name || ""}
                  onChange={(e) => setStartupForm({ ...startupForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="es_slug" className="text-xs">Slug</Label>
                <Input
                  id="es_slug"
                  value={startupForm.slug || ""}
                  onChange={(e) => setStartupForm({ ...startupForm, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="es_tagline" className="text-xs">Tagline</Label>
              <Input
                id="es_tagline"
                value={startupForm.tagline || ""}
                onChange={(e) => setStartupForm({ ...startupForm, tagline: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="es_desc" className="text-xs">Description</Label>
              <Textarea
                id="es_desc"
                rows={2}
                value={startupForm.description || ""}
                onChange={(e) => setStartupForm({ ...startupForm, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="es_cat" className="text-xs">Category</Label>
                <Select
                  value={startupForm.category}
                  onValueChange={(val) => setStartupForm({ ...startupForm, category: val })}
                >
                  <SelectTrigger id="es_cat">
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
                <Label htmlFor="es_stage" className="text-xs">Stage</Label>
                <Select
                  value={startupForm.stage || "Bootstrapped"}
                  onValueChange={(val) => setStartupForm({ ...startupForm, stage: val })}
                >
                  <SelectTrigger id="es_stage">
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
                <Label htmlFor="es_team" className="text-xs">Team Size</Label>
                <Select
                  value={startupForm.team_size || "Solo Founder"}
                  onValueChange={(val) => setStartupForm({ ...startupForm, team_size: val })}
                >
                  <SelectTrigger id="es_team">
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
                <Label htmlFor="es_mrr" className="text-xs">MRR ($)</Label>
                <Input
                  id="es_mrr"
                  type="number"
                  value={startupForm.mrr}
                  onChange={(e) => setStartupForm({ ...startupForm, mrr: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="es_users" className="text-xs">Users</Label>
                <Input
                  id="es_users"
                  type="number"
                  value={startupForm.active_users}
                  onChange={(e) => setStartupForm({ ...startupForm, active_users: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="es_growth" className="text-xs">Growth (%)</Label>
                <Input
                  id="es_growth"
                  type="number"
                  step="0.1"
                  value={startupForm.growth}
                  onChange={(e) => setStartupForm({ ...startupForm, growth: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="es_churn" className="text-xs">Churn (%)</Label>
                <Input
                  id="es_churn"
                  type="number"
                  step="0.1"
                  value={startupForm.churn}
                  onChange={(e) => setStartupForm({ ...startupForm, churn: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="es_target" className="text-xs">Target Market</Label>
                <Select
                  value={startupForm.target_market || "B2B"}
                  onValueChange={(val) => setStartupForm({ ...startupForm, target_market: val })}
                >
                  <SelectTrigger id="es_target">
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
                <Label htmlFor="es_stack" className="text-xs">Tech Stack</Label>
                <Input
                  id="es_stack"
                  value={startupForm.tech_stack || ""}
                  onChange={(e) => setStartupForm({ ...startupForm, tech_stack: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="es_web" className="text-xs">Website URL</Label>
                <Input
                  id="es_web"
                  value={startupForm.website || ""}
                  onChange={(e) => setStartupForm({ ...startupForm, website: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="es_demo" className="text-xs">Demo URL</Label>
                <Input
                  id="es_demo"
                  value={startupForm.demo_url || ""}
                  onChange={(e) => setStartupForm({ ...startupForm, demo_url: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-panel-raised/50 p-3 border border-border/60">
              <div>
                <div className="text-xs font-semibold text-foreground">Verified Status</div>
                <div className="text-[11px] text-muted-foreground">Stamp verified badge on public log.</div>
              </div>
              <Switch
                checked={startupForm.verified}
                onCheckedChange={(checked) => setStartupForm({ ...startupForm, verified: checked })}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setIsEditStartupOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="signal" disabled={updateStartupMutation.isPending}>
                {updateStartupMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: ADD MILESTONE */}
      {/* ========================================================================= */}
      <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Log Verified Milestone</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Record a revenue leap, new release, or user milestone stamped on your timeline.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!milestoneForm.title || !milestoneForm.startup_id) return;
              createMilestoneMutation.mutate(milestoneForm as any);
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="am_startup" className="text-xs">Target Startup *</Label>
              <Select
                value={milestoneForm.startup_id}
                onValueChange={(val) => setMilestoneForm({ ...milestoneForm, startup_id: val })}
              >
                <SelectTrigger id="am_startup">
                  <SelectValue placeholder="Select startup" />
                </SelectTrigger>
                <SelectContent className="bg-panel border-border">
                  {startups.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="am_title" className="text-xs">Milestone Title *</Label>
              <Input
                id="am_title"
                value={milestoneForm.title || ""}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                placeholder="e.g. Crossed $25,000 MRR"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="am_cat" className="text-xs">Category</Label>
                <Select
                  value={milestoneForm.category}
                  onValueChange={(val) => setMilestoneForm({ ...milestoneForm, category: val })}
                >
                  <SelectTrigger id="am_cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    {MILESTONE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="am_date" className="text-xs">Occurred Date</Label>
                <Input
                  id="am_date"
                  type="date"
                  value={milestoneForm.occurred_at || ""}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, occurred_at: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="am_mlabel" className="text-xs">Metric Label</Label>
                <Input
                  id="am_mlabel"
                  value={milestoneForm.metric_label || ""}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, metric_label: e.target.value })}
                  placeholder="e.g. MRR, Users, Version"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="am_mval" className="text-xs">Metric Value</Label>
                <Input
                  id="am_mval"
                  value={milestoneForm.metric_value || ""}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, metric_value: e.target.value })}
                  placeholder="e.g. $25,000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="am_proof" className="text-xs">Proof Link / Receipt URL</Label>
              <Input
                id="am_proof"
                value={milestoneForm.link_url || ""}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, link_url: e.target.value })}
                placeholder="https://github.com/... or stripe link"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="am_desc" className="text-xs">Description &amp; Reflection</Label>
              <Textarea
                id="am_desc"
                rows={3}
                value={milestoneForm.description || ""}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                placeholder="What drove this milestone? What did you learn?"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-panel-raised/50 p-3 border border-border/60">
              <div>
                <div className="text-xs font-semibold text-foreground">Countersigned Proof</div>
                <div className="text-[11px] text-muted-foreground">Mark this milestone as verified with a telemetry receipt.</div>
              </div>
              <Switch
                checked={milestoneForm.verified}
                onCheckedChange={(checked) => setMilestoneForm({ ...milestoneForm, verified: checked })}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setIsAddMilestoneOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="signal" disabled={createMilestoneMutation.isPending}>
                {createMilestoneMutation.isPending ? "Logging..." : "Log Milestone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: EDIT MILESTONE */}
      {/* ========================================================================= */}
      <Dialog open={isEditMilestoneOpen} onOpenChange={setIsEditMilestoneOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Milestone</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingMilestone) return;
              updateMilestoneMutation.mutate({ id: editingMilestone.id, updates: milestoneForm });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="em_title" className="text-xs">Title</Label>
              <Input
                id="em_title"
                value={milestoneForm.title || ""}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="em_cat" className="text-xs">Category</Label>
                <Select
                  value={milestoneForm.category}
                  onValueChange={(val) => setMilestoneForm({ ...milestoneForm, category: val })}
                >
                  <SelectTrigger id="em_cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    {MILESTONE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="em_date" className="text-xs">Date</Label>
                <Input
                  id="em_date"
                  type="date"
                  value={milestoneForm.occurred_at || ""}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, occurred_at: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="em_label" className="text-xs">Metric Label</Label>
                <Input
                  id="em_label"
                  value={milestoneForm.metric_label || ""}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, metric_label: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="em_val" className="text-xs">Metric Value</Label>
                <Input
                  id="em_val"
                  value={milestoneForm.metric_value || ""}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, metric_value: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="em_link" className="text-xs">Link / Proof</Label>
              <Input
                id="em_link"
                value={milestoneForm.link_url || ""}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, link_url: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="em_desc" className="text-xs">Description</Label>
              <Textarea
                id="em_desc"
                rows={3}
                value={milestoneForm.description || ""}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-panel-raised/50 p-3 border border-border/60">
              <div className="text-xs font-semibold text-foreground">Verified Receipt</div>
              <Switch
                checked={milestoneForm.verified}
                onCheckedChange={(checked) => setMilestoneForm({ ...milestoneForm, verified: checked })}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setIsEditMilestoneOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="signal" disabled={updateMilestoneMutation.isPending}>
                {updateMilestoneMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: QUICK EDIT PROFILE */}
      {/* ========================================================================= */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Quick Edit Profile</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify your public founder profile fields directly from the dashboard.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfileMutation.mutate(profileForm);
            }}
            className="space-y-4 py-2"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="qp_name" className="text-xs">Display Name</Label>
                <Input
                  id="qp_name"
                  value={profileForm.display_name || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qp_handle" className="text-xs">Handle (@)</Label>
                <Input
                  id="qp_handle"
                  value={profileForm.handle || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, handle: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qp_headline" className="text-xs">Headline / Role</Label>
              <Input
                id="qp_headline"
                value={profileForm.headline || ""}
                onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                placeholder="e.g. Founder at Acme · Building AI tools"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qp_bio" className="text-xs">Bio</Label>
              <Textarea
                id="qp_bio"
                rows={3}
                value={profileForm.bio || ""}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="qp_avatar" className="text-xs">Avatar URL</Label>
                <Input
                  id="qp_avatar"
                  value={profileForm.avatar_url || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qp_loc" className="text-xs">Location</Label>
                <Input
                  id="qp_loc"
                  value={profileForm.location || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="qp_web" className="text-xs">Website</Label>
                <Input
                  id="qp_web"
                  value={profileForm.website || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qp_email" className="text-xs">Public Email</Label>
                <Input
                  id="qp_email"
                  type="email"
                  value={profileForm.email || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qp_skills" className="text-xs">Skills &amp; Tech Stack</Label>
              <Input
                id="qp_skills"
                value={profileForm.skills || ""}
                onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                placeholder="React, TypeScript, Python, etc."
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="signal" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SiteShell>
  );
}
