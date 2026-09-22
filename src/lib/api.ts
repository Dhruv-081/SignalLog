import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  MOCK_STATS,
  getStoredProfile,
  saveStoredProfile,
  getStoredStartups,
  saveStoredStartups,
  getStoredMilestones,
  saveStoredMilestones,
} from "./mock";

export type Profile = Tables<"profiles"> & {
  headline?: string | null;
  github?: string | null;
  linkedin?: string | null;
  email?: string | null;
  skills?: string | null;
};

export type Startup = Tables<"startups"> & {
  stage?: string | null;
  team_size?: string | null;
  target_market?: string | null;
  demo_url?: string | null;
  tech_stack?: string | null;
};

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
    if (error || !data || data.length === 0) {
      return filterLocalStartups(getStoredStartups(), filters);
    }
    const results = data.map(shapeStartup);
    return results.length > 0 ? results : filterLocalStartups(getStoredStartups(), filters);
  } catch (err) {
    console.warn("Exception in listStartups, using stored data:", err);
    return filterLocalStartups(getStoredStartups(), filters);
  }
}

function filterLocalStartups(all: StartupWithOwner[], filters: ExploreFilters): StartupWithOwner[] {
  let list = [...all];
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }
  if (filters.category && filters.category !== "all") {
    list = list.filter((s) => s.category.toLowerCase() === filters.category!.toLowerCase());
  }
  if (filters.verifiedOnly) {
    list = list.filter((s) => s.verified);
  }
  if (filters.sort === "mrr") {
    list.sort((a, b) => (b.mrr ?? 0) - (a.mrr ?? 0));
  } else if (filters.sort === "recent") {
    list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } else if (filters.sort === "followers") {
    list.sort((a, b) => (b.follower_count ?? 0) - (a.follower_count ?? 0));
  } else {
    list.sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0));
  }
  return list;
}

export async function getStartupBySlug(slug: string): Promise<StartupWithOwner | null> {
  try {
    const { data, error } = await supabase
      .from("startups")
      .select("*, owner:profiles(*), follows(count)")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) {
      const stored = getStoredStartups();
      return stored.find((s) => s.slug === slug) ?? stored[0] ?? null;
    }
    return shapeStartup(data);
  } catch {
    const stored = getStoredStartups();
    return stored.find((s) => s.slug === slug) ?? stored[0] ?? null;
  }
}

export async function listMyStartups(profileId?: string): Promise<StartupWithOwner[]> {
  try {
    if (profileId) {
      const { data, error } = await supabase
        .from("startups")
        .select("*, owner:profiles(*), follows(count)")
        .eq("owner_id", profileId)
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(shapeStartup);
      }
    }
    // Fall back to stored startups for demo/preview
    return getStoredStartups();
  } catch {
    return getStoredStartups();
  }
}

export async function createStartup(payload: Partial<Startup> & { name: string; category: string }): Promise<StartupWithOwner> {
  const currentProfile = getStoredProfile();
  const slug = payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `startup-${Date.now()}`;
  const newStartup: StartupWithOwner = {
    id: `startup_${Date.now()}`,
    slug,
    name: payload.name,
    tagline: payload.tagline || "Building the future of software.",
    description: payload.description || "",
    category: payload.category || "SaaS",
    logo_letter: payload.logo_letter || payload.name.charAt(0).toUpperCase() || "S",
    website: payload.website || null,
    location: payload.location || currentProfile.location || null,
    owner_id: currentProfile.id,
    verified: payload.verified ?? false,
    mrr: Number(payload.mrr) || 0,
    active_users: Number(payload.active_users) || 0,
    growth: Number(payload.growth) || 0,
    churn: Number(payload.churn) || 0,
    featured: payload.featured ?? false,
    stage: payload.stage || "Bootstrapped",
    team_size: payload.team_size || "Solo Founder",
    target_market: payload.target_market || "B2B",
    demo_url: payload.demo_url || null,
    tech_stack: payload.tech_stack || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: currentProfile,
    follower_count: 0,
  };

  try {
    // Attempt Supabase insert if available
    const { data, error } = await supabase
      .from("startups")
      .insert({
        slug: newStartup.slug,
        name: newStartup.name,
        tagline: newStartup.tagline,
        description: newStartup.description,
        category: newStartup.category,
        logo_letter: newStartup.logo_letter,
        website: newStartup.website,
        location: newStartup.location,
        owner_id: currentProfile.id,
        verified: newStartup.verified,
        mrr: newStartup.mrr,
        active_users: newStartup.active_users,
        growth: newStartup.growth,
        churn: newStartup.churn,
        featured: newStartup.featured,
      })
      .select("*, owner:profiles(*)")
      .maybeSingle();

    if (!error && data) {
      const shaped = { ...shapeStartup(data), stage: newStartup.stage, team_size: newStartup.team_size, target_market: newStartup.target_market, demo_url: newStartup.demo_url, tech_stack: newStartup.tech_stack };
      const current = getStoredStartups();
      saveStoredStartups([shaped, ...current.filter((s) => s.id !== shaped.id)]);
      return shaped;
    }
  } catch (err) {
    console.warn("Could not insert startup to Supabase, using local storage:", err);
  }

  // Save to local storage
  const current = getStoredStartups();
  const updatedList = [newStartup, ...current];
  saveStoredStartups(updatedList);
  return newStartup;
}

export async function updateStartup(startupId: string, updates: Partial<Startup>): Promise<StartupWithOwner> {
  const current = getStoredStartups();
  const index = current.findIndex((s) => s.id === startupId || s.slug === startupId);
  const existing = index >= 0 ? current[index] : current[0];

  const updated: StartupWithOwner = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase
      .from("startups")
      .update({
        name: updated.name,
        slug: updated.slug,
        tagline: updated.tagline,
        description: updated.description,
        category: updated.category,
        logo_letter: updated.logo_letter,
        website: updated.website,
        location: updated.location,
        verified: updated.verified,
        mrr: updated.mrr,
        active_users: updated.active_users,
        growth: updated.growth,
        churn: updated.churn,
      })
      .eq("id", startupId);
  } catch (err) {
    console.warn("Supabase startup update fallback:", err);
  }

  if (index >= 0) {
    current[index] = updated;
    saveStoredStartups([...current]);
  } else {
    saveStoredStartups([updated, ...current]);
  }
  return updated;
}

export async function deleteStartup(startupId: string): Promise<boolean> {
  try {
    await supabase.from("startups").delete().eq("id", startupId);
  } catch (err) {
    console.warn("Supabase startup delete fallback:", err);
  }
  const current = getStoredStartups();
  const filtered = current.filter((s) => s.id !== startupId && s.slug !== startupId);
  saveStoredStartups(filtered);
  return true;
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
    if (error || !data || data.length === 0) {
      return filterLocalMilestones(getStoredMilestones(), options);
    }
    const results = data.map((row) => ({
      ...(row as unknown as Milestone),
      startup: (row as Record<string, unknown>).startup as MilestoneWithStartup["startup"],
      like_count:
        ((row as Record<string, unknown>).reactions as { count: number }[] | null)?.[0]?.count ?? 0,
    }));
    return results.length > 0 ? results : filterLocalMilestones(getStoredMilestones(), options);
  } catch {
    return filterLocalMilestones(getStoredMilestones(), options);
  }
}

function filterLocalMilestones(all: MilestoneWithStartup[], options: {
  startupId?: string;
  category?: string;
  verifiedOnly?: boolean;
  limit?: number;
}): MilestoneWithStartup[] {
  let list = [...all];
  if (options.startupId) {
    list = list.filter((m) => m.startup_id === options.startupId);
  }
  if (options.category && options.category !== "all") {
    list = list.filter((m) => m.category.toLowerCase() === options.category!.toLowerCase());
  }
  if (options.verifiedOnly) {
    list = list.filter((m) => m.verified);
  }
  return list.slice(0, options.limit ?? 50);
}

export async function createMilestone(payload: Partial<Milestone> & { title: string; startup_id: string }): Promise<MilestoneWithStartup> {
  const startups = getStoredStartups();
  const targetStartup = startups.find((s) => s.id === payload.startup_id) || startups[0];

  const newMilestone: MilestoneWithStartup = {
    id: `m_${Date.now()}`,
    startup_id: payload.startup_id || targetStartup.id,
    title: payload.title,
    description: payload.description || "",
    category: payload.category || "product",
    metric_label: payload.metric_label || null,
    metric_value: payload.metric_value || null,
    image_url: payload.image_url || null,
    link_url: payload.link_url || null,
    source: payload.source || "manual",
    verified: payload.verified ?? false,
    occurred_at: payload.occurred_at || new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString(),
    startup: targetStartup
      ? {
          id: targetStartup.id,
          name: targetStartup.name,
          slug: targetStartup.slug,
          logo_letter: targetStartup.logo_letter,
          category: targetStartup.category,
          verified: targetStartup.verified,
        }
      : null,
    like_count: 0,
  };

  try {
    await supabase.from("milestones").insert({
      startup_id: newMilestone.startup_id,
      title: newMilestone.title,
      description: newMilestone.description,
      category: newMilestone.category,
      metric_label: newMilestone.metric_label,
      metric_value: newMilestone.metric_value,
      image_url: newMilestone.image_url,
      link_url: newMilestone.link_url,
      source: newMilestone.source,
      verified: newMilestone.verified,
      occurred_at: newMilestone.occurred_at,
    });
  } catch (err) {
    console.warn("Supabase milestone insert fallback:", err);
  }

  const current = getStoredMilestones();
  saveStoredMilestones([newMilestone, ...current]);
  return newMilestone;
}

export async function updateMilestone(milestoneId: string, updates: Partial<Milestone>): Promise<MilestoneWithStartup> {
  const current = getStoredMilestones();
  const index = current.findIndex((m) => m.id === milestoneId);
  const existing = index >= 0 ? current[index] : current[0];

  const updated: MilestoneWithStartup = {
    ...existing,
    ...updates,
  };

  try {
    await supabase.from("milestones").update(updates).eq("id", milestoneId);
  } catch (err) {
    console.warn("Supabase milestone update fallback:", err);
  }

  if (index >= 0) {
    current[index] = updated;
    saveStoredMilestones([...current]);
  }
  return updated;
}

export async function deleteMilestone(milestoneId: string): Promise<boolean> {
  try {
    await supabase.from("milestones").delete().eq("id", milestoneId);
  } catch (err) {
    console.warn("Supabase milestone delete fallback:", err);
  }
  const current = getStoredMilestones();
  const filtered = current.filter((m) => m.id !== milestoneId);
  saveStoredMilestones(filtered);
  return true;
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
        { id: "1", startup_id: startupId, period: "2026-01-01", mrr: 18000, active_users: 850, verified: true },
        { id: "2", startup_id: startupId, period: "2026-02-01", mrr: 34000, active_users: 1900, verified: true },
        { id: "3", startup_id: startupId, period: "2026-03-01", mrr: 54000, active_users: 3200, verified: true },
      ];
    }
    return data;
  } catch {
    return [
      { id: "1", startup_id: startupId, period: "2026-01-01", mrr: 18000, active_users: 850, verified: true },
      { id: "2", startup_id: startupId, period: "2026-02-01", mrr: 34000, active_users: 1900, verified: true },
      { id: "3", startup_id: startupId, period: "2026-03-01", mrr: 54000, active_users: 3200, verified: true },
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
        { id: "i1", startup_id: startupId, provider: "stripe", status: "active", mode: "demo", account_label: "Stripe Live Connect", last_synced_at: new Date().toISOString() },
        { id: "i2", startup_id: startupId, provider: "github", status: "active", mode: "demo", account_label: "GitHub Repositories", last_synced_at: new Date().toISOString() },
      ];
    }
    return data;
  } catch {
    return [
      { id: "i1", startup_id: startupId, provider: "stripe", status: "active", mode: "demo", account_label: "Stripe Live Connect", last_synced_at: new Date().toISOString() },
      { id: "i2", startup_id: startupId, provider: "github", status: "active", mode: "demo", account_label: "GitHub Repositories", last_synced_at: new Date().toISOString() },
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

    const stored = getStoredProfile();
    if (stored.handle.toLowerCase() === handle.toLowerCase()) {
      return stored;
    }

    if (!error && data) {
      return { ...stored, ...data };
    }

    // Check if any stored startup owner matches
    const startups = getStoredStartups();
    const match = startups.find((s) => s.owner?.handle.toLowerCase() === handle.toLowerCase());
    if (match?.owner) {
      return match.owner;
    }

    return stored;
  } catch {
    return getStoredProfile();
  }
}

export async function updateProfile(profileId: string, updates: Partial<Profile>): Promise<Profile> {
  const current = getStoredProfile();
  const merged: Profile = {
    ...current,
    ...updates,
    id: profileId || current.id,
  };

  try {
    // Only update existing DB schema fields in Postgres
    await supabase
      .from("profiles")
      .update({
        display_name: merged.display_name,
        handle: merged.handle,
        bio: merged.bio,
        avatar_url: merged.avatar_url,
        website: merged.website,
        twitter: merged.twitter,
        location: merged.location,
      })
      .eq("id", profileId);
  } catch (err) {
    console.warn("Supabase profile update fallback:", err);
  }

  saveStoredProfile(merged);

  // Also update startups owner reference
  const startups = getStoredStartups();
  const updatedStartups = startups.map((s) => {
    if (s.owner_id === profileId || s.owner?.id === profileId) {
      return { ...s, owner: merged };
    }
    return s;
  });
  saveStoredStartups(updatedStartups);

  return merged;
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
      const stored = getStoredStartups();
      const storedTotalMrr = stored.reduce((acc, s) => acc + (s.mrr || 0), 0);
      return {
        startupCount: stored.length,
        totalMrr: storedTotalMrr,
        verifiedShare: 78.5,
      };
    }

    return {
      startupCount,
      totalMrr,
      verifiedShare: total ? Math.round(((verified.count ?? 0) / total) * 1000) / 10 : 0,
    };
  } catch {
    return MOCK_STATS;
  }
}
