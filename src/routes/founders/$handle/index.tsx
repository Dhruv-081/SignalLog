import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit3,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Sparkles,
  TrendingUp,
  Twitter,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site-shell";
import { LogoMark, VerifyBadge } from "@/components/brand";
import { MilestoneItem } from "@/components/milestone-item";
import { StartupCard } from "@/components/startup-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  getProfileByHandle,
  listMyStartups,
  listMilestones,
  updateProfile,
  type Profile,
} from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/founders/$handle/")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.handle} — Founder profile on Signallog` },
      {
        name: "description",
        content: `Explore verified startups, MRR milestones, and ship logs by @${params.handle} on Signallog.`,
      },
    ],
  }),
  component: FounderProfile,
});

function FounderProfile() {
  const { handle } = Route.useParams();
  const { user, profile: myProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch founder profile
  const profileQuery = useQuery({
    queryKey: ["founder-profile", handle],
    queryFn: () => getProfileByHandle(handle),
  });
  const founder = profileQuery.data ?? myProfile;

  // Fetch founder's startups
  const startupsQuery = useQuery({
    queryKey: ["founder-startups", founder?.id, handle],
    queryFn: async () => {
      const all = await listMyStartups(founder?.id);
      return all.filter(
        (s) =>
          s.owner_id === founder?.id ||
          s.owner?.handle?.toLowerCase() === handle.toLowerCase(),
      );
    },
    enabled: !!founder,
  });
  const startups = startupsQuery.data ?? [];

  // Fetch milestones from founder's startups
  const milestonesQuery = useQuery({
    queryKey: ["founder-milestones", startups.map((s) => s.id).join(",")],
    queryFn: async () => {
      const all = await listMilestones({ limit: 50 });
      const startupIds = new Set(startups.map((s) => s.id));
      return all.filter((m) => startupIds.has(m.startup_id));
    },
    enabled: startups.length > 0,
  });
  const milestones = milestonesQuery.data ?? [];

  // Aggregated founder metrics
  const totalMrr = startups.reduce((acc, s) => acc + (s.mrr || 0), 0);
  const totalUsers = startups.reduce((acc, s) => acc + (s.active_users || 0), 0);
  const isOwner =
    !user ||
    user.id === founder?.user_id ||
    myProfile?.handle.toLowerCase() === handle.toLowerCase() ||
    myProfile?.id === founder?.id;

  // Edit profile form state
  const [formData, setFormData] = useState<Partial<Profile>>({});

  const handleOpenEdit = () => {
    if (founder) {
      setFormData({
        display_name: founder.display_name,
        handle: founder.handle,
        headline: founder.headline ?? "",
        bio: founder.bio ?? "",
        avatar_url: founder.avatar_url ?? "",
        location: founder.location ?? "",
        website: founder.website ?? "",
        twitter: founder.twitter ?? "",
        github: founder.github ?? "",
        linkedin: founder.linkedin ?? "",
        email: founder.email ?? "",
        skills: founder.skills ?? "",
      });
    }
    setIsEditOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: async (updated: Partial<Profile>) => {
      if (!founder) return;
      return await updateProfile(founder.id, updated);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["founder-profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["founder-startups"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      toast.success("Profile updated successfully!");
      setIsEditOpen(false);
    },
    onError: (err) => {
      toast.error("Failed to update profile");
      console.error(err);
    },
  });

  const skillsList = (founder?.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (profileQuery.isLoading) {
    return (
      <SiteShell>
        <div className="py-12">
          <div className="glass h-64 animate-pulse rounded-2xl" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="py-10">
        {/* PROFILE HEADER HERO */}
        <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="relative">
                {founder?.avatar_url ? (
                  <img
                    src={founder.avatar_url}
                    alt={founder.display_name}
                    className="size-24 rounded-2xl border-2 border-signal/40 object-cover shadow-lg sm:size-28"
                  />
                ) : (
                  <div className="gradient-signal grid size-24 place-items-center rounded-2xl font-display text-3xl font-bold text-primary-foreground sm:size-28">
                    {(founder?.display_name || handle).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-2 -right-2 flex size-6 items-center justify-center rounded-full bg-panel-raised border border-border shadow-sm text-verified">
                  <CheckCircle2 className="size-4" />
                </span>
              </div>

              {/* Identity & Bio */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {founder?.display_name || handle}
                  </h1>
                  <VerifyBadge verified={true} />
                  <span className="rounded-full bg-panel-raised px-2.5 py-0.5 text-xs text-muted-foreground border border-border/70">
                    @{founder?.handle || handle}
                  </span>
                </div>

                {founder?.headline && (
                  <p className="text-sm font-medium text-signal sm:text-base">
                    {founder.headline}
                  </p>
                )}

                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {founder?.bio || "No biography provided yet."}
                </p>

                {/* Meta details & socials */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-muted-foreground">
                  {founder?.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-signal" />
                      <span>{founder.location}</span>
                    </div>
                  )}
                  {founder?.website && (
                    <a
                      href={founder.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 transition-colors hover:text-foreground hover:underline"
                    >
                      <Globe className="size-3.5 text-signal" />
                      <span>{founder.website.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                  {founder?.twitter && (
                    <a
                      href={founder.twitter.startsWith("http") ? founder.twitter : `https://x.com/${founder.twitter.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      <Twitter className="size-3.5 text-signal" />
                      <span>X / Twitter</span>
                    </a>
                  )}
                  {founder?.github && (
                    <a
                      href={founder.github.startsWith("http") ? founder.github : `https://github.com/${founder.github}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      <Github className="size-3.5 text-signal" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {founder?.linkedin && (
                    <a
                      href={founder.linkedin.startsWith("http") ? founder.linkedin : `https://linkedin.com/in/${founder.linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      <Linkedin className="size-3.5 text-signal" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {founder?.email && (
                    <a
                      href={`mailto:${founder.email}`}
                      className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      <Mail className="size-3.5 text-signal" />
                      <span>{founder.email}</span>
                    </a>
                  )}
                </div>

                {/* Skills tags */}
                {skillsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {skillsList.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-panel-raised/80 text-[11px] font-normal text-muted-foreground border-border/60"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Edit Profile & Settings */}
            <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                className="gap-2 border-border/80 hover:border-signal/50"
              >
                <Edit3 className="size-3.5 text-signal" />
                Edit Profile
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/settings">Full Settings</Link>
              </Button>
            </div>
          </div>

          {/* METRIC STRIP */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border/60 pt-6 sm:grid-cols-4">
            <div className="rounded-xl bg-panel-raised/40 p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Startups</span>
                <Building2 className="size-4 text-signal/80" />
              </div>
              <div className="num mt-2 text-2xl font-bold text-foreground">
                {startups.length}
              </div>
              <div className="text-[11px] text-muted-foreground">public logs</div>
            </div>

            <div className="rounded-xl bg-panel-raised/40 p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Combined MRR</span>
                <DollarSign className="size-4 text-verified/90" />
              </div>
              <div className="num mt-2 text-2xl font-bold text-foreground">
                {formatCurrency(totalMrr)}
              </div>
              <div className="text-[11px] text-muted-foreground">verified revenue</div>
            </div>

            <div className="rounded-xl bg-panel-raised/40 p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Active Users</span>
                <Users className="size-4 text-signal/80" />
              </div>
              <div className="num mt-2 text-2xl font-bold text-foreground">
                {formatNumber(totalUsers)}
              </div>
              <div className="text-[11px] text-muted-foreground">total community</div>
            </div>

            <div className="rounded-xl bg-panel-raised/40 p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Milestones</span>
                <Sparkles className="size-4 text-signal/80" />
              </div>
              <div className="num mt-2 text-2xl font-bold text-foreground">
                {milestones.length}
              </div>
              <div className="text-[11px] text-muted-foreground">receipts stamped</div>
            </div>
          </div>
        </div>

        {/* TABS: Startups, Milestones, About */}
        <div className="mt-10">
          <Tabs defaultValue="startups" className="space-y-6">
            <TabsList className="bg-panel border border-border/60">
              <TabsTrigger value="startups" className="gap-2">
                <Building2 className="size-4" />
                Startups ({startups.length})
              </TabsTrigger>
              <TabsTrigger value="milestones" className="gap-2">
                <Sparkles className="size-4" />
                Milestones Timeline ({milestones.length})
              </TabsTrigger>
              <TabsTrigger value="about" className="gap-2">
                <Users className="size-4" />
                About &amp; Stack
              </TabsTrigger>
            </TabsList>

            {/* STARTUPS TAB */}
            <TabsContent value="startups" className="space-y-6">
              {startups.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
                  <Building2 className="mx-auto size-10 text-signal/60 mb-3" />
                  <p className="font-display text-lg font-semibold text-foreground">No startups published yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Startups launched by this founder will appear here.</p>
                  {isOwner && (
                    <Button asChild variant="signal" size="sm" className="mt-4">
                      <Link to="/dashboard">+ Add Startup in Dashboard</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {startups.map((startup) => (
                    <div
                      key={startup.id}
                      className="glass lift relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 border border-border/70"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <LogoMark letter={startup.logo_letter} className="size-11 text-lg" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Link
                                  to="/startups/$slug"
                                  params={{ slug: startup.slug }}
                                  className="font-display text-lg font-semibold hover:text-signal transition-colors"
                                >
                                  {startup.name}
                                </Link>
                                <VerifyBadge verified={startup.verified} />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {startup.category}
                                {startup.stage ? ` · ${startup.stage}` : ""}
                                {startup.team_size ? ` · ${startup.team_size}` : ""}
                              </div>
                            </div>
                          </div>
                          <span className="num rounded-full bg-panel-raised border border-border/60 px-2.5 py-1 text-xs text-signal font-semibold">
                            +{startup.growth}% MRR
                          </span>
                        </div>

                        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                          {startup.tagline}
                        </p>

                        {/* Extended tags */}
                        {(startup.target_market || startup.tech_stack) && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {startup.target_market && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60">
                                {startup.target_market}
                              </Badge>
                            )}
                            {startup.tech_stack &&
                              startup.tech_stack
                                .split(",")
                                .slice(0, 3)
                                .map((tech, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="bg-panel-raised text-[10px] text-muted-foreground"
                                  >
                                    {tech.trim()}
                                  </Badge>
                                ))}
                          </div>
                        )}
                      </div>

                      {/* Metrics Footer */}
                      <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4 text-xs">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">MRR</span>
                            <span className="num font-bold text-foreground">
                              {formatCurrency(startup.mrr)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Users</span>
                            <span className="num font-bold text-foreground">
                              {formatNumber(startup.active_users)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Followers</span>
                            <span className="num font-bold text-foreground">
                              {startup.follower_count}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOwner && (
                            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                              <Link to="/startups/$slug/edit" params={{ slug: startup.slug }}>
                                Edit
                              </Link>
                            </Button>
                          )}
                          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                            <Link to="/startups/$slug" params={{ slug: startup.slug }}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* MILESTONES TAB */}
            <TabsContent value="milestones" className="space-y-4">
              {milestones.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
                  <Sparkles className="mx-auto size-10 text-signal/60 mb-3" />
                  <p className="font-display text-lg font-semibold text-foreground">No milestones logged yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ship updates, revenue achievements, and launch milestones will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((m) => (
                    <MilestoneItem key={m.id} milestone={m} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ABOUT TAB */}
            <TabsContent value="about" className="space-y-6">
              <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Founder Biography</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {founder?.bio || "No biography specified."}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">Skills &amp; Technology</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skillsList.length > 0 ? (
                      skillsList.map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-panel-raised px-3 py-1.5 text-xs text-foreground border border-border/70"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No skills specified.</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/60 pt-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">Verification &amp; Transparency</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This founder logs verified telemetry via Stripe Connect, GitHub releases, and direct API instrument feeds.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-verified/10 text-verified border border-verified/30 px-3 py-1 text-xs font-medium">
                      <CheckCircle2 className="size-3.5" />
                      Receipts Verified
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Member since {new Date(founder?.created_at || Date.now()).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Founder Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Update your public founder identity, bio, links, and expertise fields.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(formData);
            }}
            className="space-y-4 py-2"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="display_name" className="text-xs">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name || ""}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g. Dhruv Choudhary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="handle" className="text-xs">Username / Handle</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">@</span>
                  <Input
                    id="handle"
                    className="pl-7"
                    value={formData.handle || ""}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    placeholder="handle"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="headline" className="text-xs">Headline / Title</Label>
              <Input
                id="headline"
                value={formData.headline || ""}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="e.g. Building AI agents & telemetry tools"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs">Bio / Description</Label>
              <Textarea
                id="bio"
                rows={3}
                value={formData.bio || ""}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Share your founder journey, what you are building, and what you care about."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="avatar_url" className="text-xs">Avatar Image URL</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url || ""}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs">Website / Portfolio</Label>
                <Input
                  id="website"
                  value={formData.website || ""}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Public Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="founder@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="twitter" className="text-xs">X / Twitter</Label>
                <Input
                  id="twitter"
                  value={formData.twitter || ""}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="username or link"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="github" className="text-xs">GitHub</Label>
                <Input
                  id="github"
                  value={formData.github || ""}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  placeholder="username or link"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="linkedin" className="text-xs">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin || ""}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="username or link"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skills" className="text-xs">Skills &amp; Tech Stack (comma separated)</Label>
              <Input
                id="skills"
                value={formData.skills || ""}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="React, TypeScript, Next.js, Supabase, Python, AI/ML"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="signal"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SiteShell>
  );
}
