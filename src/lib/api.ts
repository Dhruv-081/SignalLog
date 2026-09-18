import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Startup = Tables<"startups">;
export type Milestone = Tables<"milestones">;
export type MetricPoint = Tables<"metric_points">;
export type Integration = Tables<"integrations">;
export type Notification = Tables<"notifications">;

export type StartupWithOwner = Startup & { owner: Profile | null; follower_count: number };
export type MilestoneWithStartup = Milestone & {
  startup: Pick<Startup, "id" | "name" | "slug" | "logo_letter" | "category" | "verified"> | null;
  like_count: number;
};

export type ExploreFilters = {
  search?: string;
  category?: string;
  verifiedOnly?: boolean;
  sort?: "trending" | "mrr" | "recent" | "followers";
};

/* ------------------------------ startups ------------------------------ */

export async function listStartups(filters: ExploreFilters = {}): Promise<StartupWithOwner[]> {
  let query = supabase
    .from("startups")
    .select("*, owner:profiles(*), follows(count)")
    .limit(60);

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,tagline.ilike.%${filters.search}%,category.ilike.%${filters.search}%`,
    );
  }
  if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.verifiedOnly) query = query.eq("verified", true);

  switch (filters.sort) {
    case "mrr":
      query = query.order("mrr", { ascending: false });
      break;
    case "recent":
      query = query.order("updated_at", { ascending: false });
      break;
    default:
      query = query.order("growth", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(shapeStartup);
}

export async function getStartupBySlug(slug: string): Promise<StartupWithOwner | null> {
  const { data, error } = await supabase
    .from("startups")
    .select("*, owner:profiles(*), follows(count)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? shapeStartup(data) : null;
}

export async function listMyStartups(profileId: string): Promise<StartupWithOwner[]> {
  const { data, error } = await supabase
    .from("startups")
    .select("*, owner:profiles(*), follows(count)")
    .eq("owner_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(shapeStartup);
}

function shapeStartup(row: Record<string, unknown>): StartupWithOwner {
  const follows = row.follows as { count: number }[] | null;
  return {
    ...(row as Startup),
    owner: (row.owner as Profile | null) ?? null,
    follower_count: follows?.[0]?.count ?? 0,
  };
}

/* ----------------------------- milestones ----------------------------- */

export async function listMilestones(options: {
  startupId?: string;
  limit?: number;
  category?: string;
  verifiedOnly?: boolean;
}): Promise<MilestoneWithStartup[]> {
  let query = supabase
    .from("milestones")
    .select(
      "*, startup:startups(id,name,slug,logo_letter,category,verified), reactions(count)",
    )
    .order("occurred_at", { ascending: false })
    .limit(options.limit ?? 30);

  if (options.startupId) query = query.eq("startup_id", options.startupId);
  if (options.category && options.category !== "all") query = query.eq("category", options.category);
  if (options.verifiedOnly) query = query.eq("verified", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as unknown as Milestone),
    startup: (row as Record<string, unknown>).startup as MilestoneWithStartup["startup"],
    like_count:
      ((row as Record<string, unknown>).reactions as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
}

export async function listMetricPoints(startupId: string): Promise<MetricPoint[]> {
  const { data, error } = await supabase
    .from("metric_points")
    .select("*")
    .eq("startup_id", startupId)
    .order("period", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listIntegrations(startupId: string): Promise<Integration[]> {
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("startup_id", startupId);
  if (error) throw error;
  return data ?? [];
}

/* ------------------------------ follows ------------------------------- */

export async function isFollowing(startupId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("startup_id", startupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function toggleFollow(startupId: string, userId: string, following: boolean) {
  if (following) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("startup_id", startupId)
      .eq("user_id", userId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from("follows").insert({ startup_id: startupId, user_id: userId });
  if (error) throw error;
  return true;
}

export async function listMyReactions(userId: string) {
  const { data, error } = await supabase
    .from("reactions")
    .select("milestone_id, kind")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function toggleReaction(
  milestoneId: string,
  userId: string,
  kind: "like" | "bookmark",
  active: boolean,
) {
  if (active) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("milestone_id", milestoneId)
      .eq("user_id", userId)
      .eq("kind", kind);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from("reactions")
    .insert({ milestone_id: milestoneId, user_id: userId, kind });
  if (error) throw error;
  return true;
}

/* --------------------------- notifications ---------------------------- */

export async function listNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationsRead(ids?: string[]) {
  let query = supabase.from("notifications").update({ read: true });
  query = ids?.length ? query.in("id", ids) : query.eq("read", false);
  const { error } = await query;
  if (error) throw error;
}

/* ------------------------------ profiles ------------------------------ */

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function platformStats() {
  const [startups, milestones, verified] = await Promise.all([
    supabase.from("startups").select("mrr"),
    supabase.from("milestones").select("id", { count: "exact", head: true }),
    supabase.from("milestones").select("id", { count: "exact", head: true }).eq("verified", true),
  ]);
  const totalMrr = (startups.data ?? []).reduce((sum, row) => sum + (row.mrr ?? 0), 0);
  const total = milestones.count ?? 0;
  return {
    startupCount: startups.data?.length ?? 0,
    totalMrr,
    verifiedShare: total ? Math.round(((verified.count ?? 0) / total) * 1000) / 10 : 0,
  };
}
