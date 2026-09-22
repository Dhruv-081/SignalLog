import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Eye,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Twitter,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeading, SiteShell } from "@/components/site-shell";
import { VerifyBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { updateProfile, type Profile } from "@/lib/api";
import { resetAllMockData, getStoredProfile } from "@/lib/mock";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Account & Profile Settings — Signallog" },
      { name: "description", content: "Manage your founder profile, public receipts, and account settings." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<Profile>>({
    display_name: "",
    handle: "",
    headline: "",
    bio: "",
    avatar_url: "",
    location: "",
    website: "",
    twitter: "",
    github: "",
    linkedin: "",
    email: "",
    skills: "",
  });

  const [notifyDigest, setNotifyDigest] = useState(true);
  const [notifyReactions, setNotifyReactions] = useState(true);
  const [notifyVerification, setNotifyVerification] = useState(true);

  // Synchronize when profile data is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        handle: profile.handle || "",
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
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (updated: Partial<Profile>) => {
      const targetId = profile?.id || "1";
      return await updateProfile(targetId, updated);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["founder-profile"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      toast.success("Profile changes saved successfully!");
    },
    onError: (err) => {
      toast.error("Failed to save profile changes.");
      console.error(err);
    },
  });

  const handleReset = () => {
    resetAllMockData();
    const fresh = getStoredProfile();
    setFormData({
      display_name: fresh.display_name,
      handle: fresh.handle,
      headline: fresh.headline || "",
      bio: fresh.bio || "",
      avatar_url: fresh.avatar_url || "",
      location: fresh.location || "",
      website: fresh.website || "",
      twitter: fresh.twitter || "",
      github: fresh.github || "",
      linkedin: fresh.linkedin || "",
      email: fresh.email || "",
      skills: fresh.skills || "",
    });
    queryClient.invalidateQueries();
    toast.info("Sample profile data restored.");
  };

  const skillsList = (formData.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <SiteShell>
      <PageHeading
        eyebrow="account preferences"
        title="Settings & Profile"
        description="Customize your public founder profile, contact receipts, and platform notifications."
      />

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="bg-panel border border-border/60">
          <TabsTrigger value="profile" className="gap-2">
            <User className="size-4" />
            Profile &amp; Identity
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Sparkles className="size-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <RotateCcw className="size-4" />
            Demo &amp; Data
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            {/* EDIT FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate(formData);
              }}
              className="glass rounded-3xl p-6 sm:p-8 space-y-6 border border-border/70"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Public Founder Details
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    These fields are publicly displayed on your founder portfolio page.
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="signal"
                  size="sm"
                  disabled={updateMutation.isPending}
                  className="gap-2"
                >
                  <Save className="size-3.5" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              {/* Name & Handle */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="s_display_name">Display Name *</Label>
                  <Input
                    id="s_display_name"
                    value={formData.display_name || ""}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="e.g. Dhruv Choudhary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s_handle">Handle / Username *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">@</span>
                    <Input
                      id="s_handle"
                      className="pl-7"
                      value={formData.handle || ""}
                      onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                      placeholder="username"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <Label htmlFor="s_headline">Headline / Professional Role</Label>
                <Input
                  id="s_headline"
                  value={formData.headline || ""}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. Founder at Acme Corp · Building AI agents & developer tools"
                />
                <p className="text-[11px] text-muted-foreground">
                  A concise summary shown prominently under your name.
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="s_bio">Bio / About You</Label>
                <Textarea
                  id="s_bio"
                  rows={4}
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell your story, what problems you solve, and what milestones you're tracking."
                />
              </div>

              {/* Avatar & Location */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="s_avatar">Avatar URL</Label>
                  <Input
                    id="s_avatar"
                    value={formData.avatar_url || ""}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s_location">Location</Label>
                  <Input
                    id="s_location"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA or Remote"
                  />
                </div>
              </div>

              {/* Links: Website & Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="s_website">Website / Portfolio URL</Label>
                  <Input
                    id="s_website"
                    value={formData.website || ""}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s_email">Public Contact Email</Label>
                  <Input
                    id="s_email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="dhruv@example.com"
                  />
                </div>
              </div>

              {/* Social Profiles: Twitter, GitHub, LinkedIn */}
              <div className="border-t border-border/60 pt-4 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Social Proof &amp; Channels
                </h3>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="s_twitter" className="text-xs">X / Twitter</Label>
                    <Input
                      id="s_twitter"
                      value={formData.twitter || ""}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="@handle or URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="s_github" className="text-xs">GitHub</Label>
                    <Input
                      id="s_github"
                      value={formData.github || ""}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="github.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="s_linkedin" className="text-xs">LinkedIn</Label>
                    <Input
                      id="s_linkedin"
                      value={formData.linkedin || ""}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/..."
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="border-t border-border/60 pt-4 space-y-2">
                <Label htmlFor="s_skills">Skills &amp; Technologies (comma separated)</Label>
                <Input
                  id="s_skills"
                  value={formData.skills || ""}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="React, TypeScript, Next.js, Supabase, Python, AI/ML, Rust"
                />
                <p className="text-[11px] text-muted-foreground">
                  Helps users discover your startups by technology and product domains.
                </p>
              </div>

              {/* Submit footer */}
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="size-3.5" />
                  Reset to Sample Values
                </Button>

                <Button
                  type="submit"
                  variant="signal"
                  disabled={updateMutation.isPending}
                  className="gap-2"
                >
                  <Save className="size-3.5" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>

            {/* LIVE PROFILE CARD PREVIEW */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Eye className="size-3.5 text-signal" />
                  Live Card Preview
                </div>
                {formData.handle && (
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Link to="/founders/$handle" params={{ handle: formData.handle }}>
                      View Page <ArrowUpRight className="size-3" />
                    </Link>
                  </Button>
                )}
              </div>

              <div className="glass relative overflow-hidden rounded-3xl p-6 border border-border/80 shadow-glass">
                {/* Header */}
                <div className="flex items-start gap-4">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt={formData.display_name || "Founder"}
                      className="size-16 rounded-2xl border border-signal/40 object-cover shadow-md"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="gradient-signal grid size-16 place-items-center rounded-2xl font-display text-xl font-bold text-primary-foreground shadow-md">
                      {(formData.display_name || "F").slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-lg font-bold text-foreground">
                        {formData.display_name || "Founder Name"}
                      </span>
                      <VerifyBadge verified={true} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{formData.handle || "handle"}
                    </div>
                    {formData.location && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-0.5">
                        <MapPin className="size-3 text-signal" />
                        <span>{formData.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Headline */}
                {formData.headline && (
                  <p className="mt-4 text-xs font-medium text-signal">
                    {formData.headline}
                  </p>
                )}

                {/* Bio */}
                <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {formData.bio || "Your biography will appear here."}
                </p>

                {/* Socials row */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                  {formData.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="size-3 text-signal" />
                      <span className="truncate max-w-[120px]">{formData.website.replace(/^https?:\/\//, "")}</span>
                    </div>
                  )}
                  {formData.twitter && (
                    <div className="flex items-center gap-1">
                      <Twitter className="size-3 text-signal" />
                      <span>X</span>
                    </div>
                  )}
                  {formData.github && (
                    <div className="flex items-center gap-1">
                      <Github className="size-3 text-signal" />
                      <span>GitHub</span>
                    </div>
                  )}
                  {formData.linkedin && (
                    <div className="flex items-center gap-1">
                      <Linkedin className="size-3 text-signal" />
                      <span>LinkedIn</span>
                    </div>
                  )}
                  {formData.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="size-3 text-signal" />
                      <span className="truncate max-w-[120px]">{formData.email}</span>
                    </div>
                  )}
                </div>

                {/* Skills tags */}
                {skillsList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {skillsList.slice(0, 5).map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-panel-raised text-[10px] text-muted-foreground py-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {skillsList.length > 5 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        +{skillsList.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="glass max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 border border-border/70">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Notification Preferences
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Control which email alerts and event webhooks ping you.
              </p>
            </div>

            <div className="space-y-4 divide-y divide-border/60">
              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-sm font-medium text-foreground">Weekly Milestone Digest</div>
                  <div className="text-xs text-muted-foreground">
                    Get a summary of trending milestones in your category.
                  </div>
                </div>
                <Switch checked={notifyDigest} onCheckedChange={setNotifyDigest} />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-sm font-medium text-foreground">Followers &amp; Reaction Alerts</div>
                  <div className="text-xs text-muted-foreground">
                    Notify when other founders like or bookmark your milestone receipts.
                  </div>
                </div>
                <Switch checked={notifyReactions} onCheckedChange={setNotifyReactions} />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-sm font-medium text-foreground">Integration Telemetry Sync</div>
                  <div className="text-xs text-muted-foreground">
                    Alert whenever Stripe or GitHub automated receipts sync or encounter issues.
                  </div>
                </div>
                <Switch checked={notifyVerification} onCheckedChange={setNotifyVerification} />
              </div>
            </div>

            <div className="pt-4 border-t border-border/60 flex justify-end">
              <Button
                variant="signal"
                size="sm"
                onClick={() => toast.success("Notification preferences updated.")}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* DATA & DEMO TAB */}
        <TabsContent value="data" className="space-y-6">
          <div className="glass max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 border border-border/70">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Local Storage &amp; Demo Mode
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reset your cached local startups, milestones, and profile data to pristine seed state.
              </p>
            </div>

            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-muted-foreground">
              Resetting will clear all locally created startups, edited profiles, and newly published milestones.
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="size-3.5" />
              Reset All Local Test Data
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </SiteShell>
  );
}
