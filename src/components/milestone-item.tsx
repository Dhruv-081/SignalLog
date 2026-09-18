import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, ExternalLink, Heart, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LogoMark, VerifyBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { listMyReactions, toggleReaction, type MilestoneWithStartup } from "@/lib/api";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MilestoneItem({
  milestone,
  showStartup = true,
  onEdit,
  onDelete,
}: {
  milestone: MilestoneWithStartup;
  showStartup?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reactions } = useQuery({
    queryKey: ["my-reactions", user?.id],
    queryFn: () => listMyReactions(user!.id),
    enabled: !!user,
  });

  const liked = !!reactions?.some((r) => r.milestone_id === milestone.id && r.kind === "like");
  const bookmarked = !!reactions?.some(
    (r) => r.milestone_id === milestone.id && r.kind === "bookmark",
  );

  const react = useMutation({
    mutationFn: async (kind: "like" | "bookmark") => {
      if (!user) throw new Error("sign-in-required");
      const active = kind === "like" ? liked : bookmarked;
      return toggleReaction(milestone.id, user.id, kind, active);
    },
    onSuccess: (_data, kind) => {
      queryClient.invalidateQueries({ queryKey: ["my-reactions"] });
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      if (kind === "bookmark") toast.success("Bookmark updated");
    },
    onError: (error: Error) => {
      toast.error(
        error.message === "sign-in-required"
          ? "Sign in to react to milestones"
          : "Could not save that reaction",
      );
    },
  });

  return (
    <article className="glass relative rounded-2xl p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={cn(
            "mt-2 size-2 shrink-0 rounded-full",
            milestone.verified ? "bg-verified" : "bg-demo",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold">{milestone.title}</h3>
            <VerifyBadge verified={milestone.verified} source={milestone.source} />
          </div>
          <div className="num mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="capitalize">{milestone.category}</span>
            <span>·</span>
            <span>{formatLongDate(milestone.occurred_at)}</span>
            {showStartup && milestone.startup ? (
              <>
                <span>·</span>
                <Link
                  to="/startups/$slug"
                  params={{ slug: milestone.startup.slug }}
                  className="inline-flex items-center gap-1.5 text-foreground hover:text-signal"
                >
                  <LogoMark
                    letter={milestone.startup.logo_letter}
                    className="size-4 text-[9px]"
                  />
                  {milestone.startup.name}
                </Link>
              </>
            ) : null}
          </div>

          {milestone.description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {milestone.description}
            </p>
          ) : null}

          {milestone.metric_value ? (
            <div className="mt-4 inline-flex items-baseline gap-2 rounded-xl bg-background/50 px-3 py-2 ring-1 ring-border">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {milestone.metric_label ?? "Metric"}
              </span>
              <span className="num text-lg font-bold text-foreground">{milestone.metric_value}</span>
            </div>
          ) : null}

          {milestone.image_url ? (
            <img
              src={milestone.image_url}
              alt=""
              className="mt-4 max-h-72 w-full rounded-xl object-cover ring-1 ring-border"
              loading="lazy"
            />
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => react.mutate("like")}
              className={cn(liked && "text-signal")}
            >
              <Heart className={cn("size-4", liked && "fill-current")} />
              <span className="num text-xs">{milestone.like_count + (liked ? 0 : 0)}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => react.mutate("bookmark")}
              className={cn(bookmarked && "text-verified")}
            >
              <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
            </Button>
            {milestone.link_url ? (
              <Button variant="ghost" size="sm" asChild>
                <a href={milestone.link_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" /> Link
                </a>
              </Button>
            ) : null}
            {onEdit ? (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Pencil className="size-4" /> Edit
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
