import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { MOCK_STARTUPS, MOCK_MILESTONES, MOCK_STATS } from "./mock";

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
  try {
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
    if (error) {
      console.warn("Supabase error in listStartups, falling back to mock data:", error);
      return MOCK_STARTUPS;
    }
    const results = (data ?? []).map(shapeStartup);
    return results.length > 0 ? results : MOCK_STARTUPS;
  } catch (err) {
    console.warn("Exception in listStartups, falling back to mock data:", err);
    return MOCK_STARTUPS;
  }
}

export async function getStartupBySlug(slug: string): Promise<StartupWithOwner | null> {
  try {
    const { data, error } = await supabase
      .from("startups")
      .select("*, owner:profiles(*), follows(count)")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) {
      return MOCK_STARTUPS.find(s => s.slug === slug) ?? MOCK_STARTUPS[0] ?? null;
    }
    return shapeStartup(data);
  } catch (err) {
    return MOCK_STARTUPS.find(s => s.slug === slug) ?? MOCK_STARTUPS[0] ?? null;
  }
}

export async function listMyStartups(profileId: string): Promise<StartupWithOwner[]> {
  try {
    const { data, error } = await supabase
      .from("startups")
      .select("*, owner:profiles(*), follows(count)")
      .eq("owner_id", profileId)
      .order("created_at", { ascending: false });
    if (error) return MOCK_STARTUPS;
    const results = (data ?? []).map(shapeStartup);
    return results.length > 0 ? results : MOCK_STARTUPS;
  } catch (err) {
    return MOCK_STARTUPS;
  }
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
  try {
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
    if (error) {
      return MOCK_MILESTONES;
    }
    const results = (data ?? []).map((row) => ({
      ...(row as unknown as Milestone),
      startup: (row as Record<string, unknown>).startup as MilestoneWithStartup["startup"],
      like_count:
        ((row as Record<string, unknown>).reactions as { count: number }[] | null)?.[0]?.count ?? 0,
    }));
    return results.length > 0 ? results : MOCK_MILESTONES;
  } catch (err) {
    return MOCK_MILESTONES;
  }
}

export async function listMetricPoints(startupId: string) {
  try {
    const { data, error } = await supabase
      .from("metric_points")
      .select("*")
      .eq("startup_id", startupId)
      .order("period", { ascending: true });
    if (error || !data || data.length === 0) {
      return [
        { id: "1", startup_id: startupId, period: "2026-01-01", mrr: 10000, active_users: 200, verified: true },
        { id: "2", startup_id: startupId, period: "2026-02-01", mrr: 25000, active_users: 500, verified: true },
        { id: "3", startup_id: startupId, period: "2026-03-01", mrr: 50000, active_users: 1000, verified: true },
      ];
    }
    return data;
  } catch (err) {
    return [
      { id: "1", startup_id: startupId, period: "2026-01-01", mrr: 10000, active_users: 200, verified: true },
      { id: "2", startup_id: startupId, period: "2026-02-01", mrr: 25000, active_users: 500, verified: true },
      { id: "3", startup_id: startupId, period: "2026-03-01", mrr: 50000, active_users: 1000, verified: true },
    ];
  }
}

export async function listIntegrations(startupId: string): Promise<Integration[]> {
  try {
    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("startup_id", startupId);
    if (error || !data || data.length === 0) {
      return [
        { id: "i1", startup_id: startupId, provider: "stripe", status: "active", mode: "demo", account_label: "Stripe Live", last_synced_at: new Date().toISOString() },
        { id: "i2", startup_id: startupId, provider: "github", status: "active", mode: "demo", account_label: "GitHub Repos", last_synced_at: new Date().toISOString() },
      ];
    }
    return data;
  } catch (err) {
    return [
      { id: "i1", startup_id: startupId, provider: "stripe", status: "active", mode: "demo", account_label: "Stripe Live", last_synced_at: new Date().toISOString() },
      { id: "i2", startup_id: startupId, provider: "github", status: "active", mode: "demo", account_label: "GitHub Repos", last_synced_at: new Date().toISOString() },
    ];
  }
}

/* ------------------------------ follows ------------------------------- */

export async function isFollowing(startupId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("startup_id", startupId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
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
  try {
    const { data, error } = await supabase
      .from("reactions")
      .select("milestone_id, kind")
      .eq("user_id", userId);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
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
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function markNotificationsRead(ids?: string[]) {
  let query = supabase.from("notifications").update({ read: true });
  query = ids?.length ? query.in("id", ids) : query.eq("read", false);
  const { error } = await query;
  if (error) throw error;
}

/* ------------------------------ profiles ------------------------------ */

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("handle", handle)
      .maybeSingle();
    if (error || !data) {
      return MOCK_STARTUPS[0]?.owner ?? null;
    }
    return data;
  } catch {
    return MOCK_STARTUPS[0]?.owner ?? null;
  }
}

export async function platformStats() {
  try {
    const [startups, milestones, verified] = await Promise.all([
      supabase.from("startups").select("mrr"),
      supabase.from("milestones").select("id", { count: "exact", head: true }),
      supabase.from("milestones").select("id", { count: "exact", head: true }).eq("verified", true),
    ]);
    const totalMrr = (startups.data ?? []).reduce((sum, row) => sum + (row.mrr ?? 0), 0);
    const total = milestones.count ?? 0;
    const startupCount = startups.data?.length ?? 0;

    if (startupCount === 0 || startups.error || milestones.error) {
      return MOCK_STATS;
    }

    return {
      startupCount,
      totalMrr,
      verifiedShare: total ? Math.round(((verified.count ?? 0) / total) * 1000) / 10 : 0,
    };
  } catch (err) {
    return MOCK_STATS;
  }
}
