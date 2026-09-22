import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, SiteShell } from "@/components/site-shell";
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
import { useAuth } from "@/hooks/use-auth";
import { listMyStartups, createMilestone, type Milestone } from "@/lib/api";
import { MILESTONE_CATEGORIES } from "@/lib/format";

export const Route = createFileRoute("/milestones/new")({
  head: () => ({
    meta: [
      { title: "Publish New Milestone — Signallog" },
      { name: "description", content: "Stamp and log a verified founder milestone." },
    ],
  }),
  component: NewMilestone,
});

function NewMilestone() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const startupsQuery = useQuery({
    queryKey: ["my-startups", profile?.id],
    queryFn: () => listMyStartups(profile?.id),
  });
  const startups = startupsQuery.data ?? [];

  const [form, setForm] = useState<Partial<Milestone>>({
    startup_id: "",
    title: "",
    description: "",
    category: "revenue",
    metric_label: "MRR",
    metric_value: "",
    link_url: "",
    verified: true,
    occurred_at: new Date().toISOString().split("T")[0],
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<Milestone> & { title: string; startup_id: string }) => {
      return await createMilestone(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      queryClient.invalidateQueries({ queryKey: ["my-milestones"] });
      toast.success("Milestone published successfully!");
      navigate({ to: "/milestones" });
    },
    onError: () => toast.error("Failed to publish milestone."),
  });

  return (
    <SiteShell>
      <div className="py-8 max-w-2xl mx-auto space-y-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link to="/dashboard">
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
        </Button>

        <PageHeading
          eyebrow="public verification"
          title="Publish New Milestone"
          description="Stamp your next build-in-public receipt: revenue milestones, user leaps, or major shipping events."
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const targetStartupId = form.startup_id || startups[0]?.id;
            if (!form.title || !targetStartupId) {
              toast.error("Please specify a title and select a startup.");
              return;
            }
            createMutation.mutate({ ...form, startup_id: targetStartupId } as any);
          }}
          className="glass rounded-3xl p-6 sm:p-8 space-y-6 border border-border/70"
        >
          <div className="space-y-1.5">
            <Label htmlFor="nm_startup" className="text-xs">Select Startup *</Label>
            {startups.length === 0 ? (
              <div className="rounded-xl border border-destructive/30 p-3 text-xs text-muted-foreground">
                You have not added any startups yet.{" "}
                <Link to="/dashboard" className="text-signal underline">
                  Add a startup in your dashboard first.
                </Link>
              </div>
            ) : (
              <Select
                value={form.startup_id || startups[0]?.id}
                onValueChange={(val) => setForm({ ...form, startup_id: val })}
              >
                <SelectTrigger id="nm_startup">
                  <SelectValue placeholder="Choose startup" />
                </SelectTrigger>
                <SelectContent className="bg-panel border-border">
                  {startups.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nm_title" className="text-xs">Milestone Headline *</Label>
            <Input
              id="nm_title"
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Surpassed $30,000 MRR"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nm_category" className="text-xs">Category</Label>
              <Select
                value={form.category}
                onValueChange={(val) => setForm({ ...form, category: val })}
              >
                <SelectTrigger id="nm_category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-panel border-border">
                  {MILESTONE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nm_date" className="text-xs">Date Occurred</Label>
              <Input
                id="nm_date"
                type="date"
                value={form.occurred_at || ""}
                onChange={(e) => setForm({ ...form, occurred_at: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nm_label" className="text-xs">Metric Label</Label>
              <Input
                id="nm_label"
                value={form.metric_label || ""}
                onChange={(e) => setForm({ ...form, metric_label: e.target.value })}
                placeholder="e.g. MRR, Active Users"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nm_value" className="text-xs">Metric Value</Label>
              <Input
                id="nm_value"
                value={form.metric_value || ""}
                onChange={(e) => setForm({ ...form, metric_value: e.target.value })}
                placeholder="e.g. $30,000 or 5,200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nm_proof" className="text-xs">Proof / Receipt Link</Label>
            <Input
              id="nm_proof"
              value={form.link_url || ""}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https://dashboard.stripe.com/... or tweet URL"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nm_desc" className="text-xs">Description / Key Notes</Label>
            <Textarea
              id="nm_desc"
              rows={4}
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What changes did you ship? What channel drove this milestone?"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-panel-raised/50 p-3.5 border border-border/60">
            <div>
              <div className="text-xs font-semibold text-foreground">Verified Milestone</div>
              <div className="text-[11px] text-muted-foreground">Stamp with green verified checkmark.</div>
            </div>
            <Switch
              checked={form.verified}
              onCheckedChange={(checked) => setForm({ ...form, verified: checked })}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">Cancel</Link>
            </Button>
            <Button
              type="submit"
              variant="signal"
              size="sm"
              disabled={createMutation.isPending || startups.length === 0}
              className="gap-2"
            >
              <Sparkles className="size-3.5" />
              {createMutation.isPending ? "Publishing..." : "Publish Milestone"}
            </Button>
          </div>
        </form>
      </div>
    </SiteShell>
  );
}
