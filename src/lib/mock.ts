import type { StartupWithOwner, MilestoneWithStartup, Profile, Startup, Milestone } from "@/lib/api";

const STORAGE_KEY_STARTUPS = "signallog_mock_startups_v2";
const STORAGE_KEY_MILESTONES = "signallog_mock_milestones_v2";
const STORAGE_KEY_PROFILE = "signallog_mock_profile_v2";

export const DEFAULT_PROFILE: Profile = {
  id: "1",
  user_id: "u1",
  handle: "acme",
  display_name: "Dhruv Choudhary",
  headline: "Building AI agents & high-performance instrument tools",
  bio: "Founder at Acme Corp. Shipping products in public, measuring verified metrics, and building open tools for modern teams.",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
  website: "https://dhruvchoudhary.dev",
  twitter: "https://x.com/dhruvchoudhary",
  github: "https://github.com/dhruvchoudhary",
  linkedin: "https://linkedin.com/in/dhruvchoudhary",
  email: "dhruv@acmecorp.dev",
  skills: "React, TypeScript, Supabase, TailwindCSS, Rust, AI/ML",
  location: "San Francisco, CA",
  created_at: "2026-01-10T10:00:00.000Z",
};

export const INITIAL_MOCK_STARTUPS: StartupWithOwner[] = [
  {
    id: "1",
    slug: "acme-corp",
    name: "Acme Corp",
    tagline: "High precision analytics & verified telemetry for founders",
    description: "Real-time telemetry and revenue proof engine. Connect your Stripe & GitHub to showcase verifiable growth without noise.",
    category: "SaaS",
    logo_letter: "A",
    website: "https://acmecorp.dev",
    location: "San Francisco, CA",
    owner_id: "1",
    verified: true,
    mrr: 54000,
    active_users: 3200,
    growth: 18.5,
    churn: 1.2,
    featured: true,
    stage: "Profitable",
    team_size: "6-10",
    target_market: "B2B",
    tech_stack: "Next.js, TypeScript, PostgreSQL, Python, Go",
    demo_url: "https://demo.acmecorp.dev",
    created_at: "2026-01-15T08:00:00.000Z",
    updated_at: new Date().toISOString(),
    owner: DEFAULT_PROFILE,
    follower_count: 342,
  },
  {
    id: "2",
    slug: "beta-labs",
    name: "Beta Labs",
    tagline: "Autonomous evaluation and stress testing for LLM pipelines",
    description: "Benchmark AI agents with deterministic sandboxes, trace latencies, and prevent prompt regressions at scale.",
    category: "AI",
    logo_letter: "B",
    website: "https://betalabs.ai",
    location: "New York, NY",
    owner_id: "1",
    verified: true,
    mrr: 14500,
    active_users: 780,
    growth: 32.4,
    churn: 2.1,
    featured: true,
    stage: "Seed",
    team_size: "2-5",
    target_market: "DevTools",
    tech_stack: "Python, PyTorch, React, FastAPI, DuckDB",
    demo_url: "https://betalabs.ai/demo",
    created_at: "2026-02-01T12:00:00.000Z",
    updated_at: new Date().toISOString(),
    owner: DEFAULT_PROFILE,
    follower_count: 189,
  },
  {
    id: "3",
    slug: "hyperflow",
    name: "Hyperflow",
    tagline: "Fast asynchronous webhook queues and replay debuggers",
    description: "Zero-loss webhook proxy with instant replay, local tunnel CLI, and automated dead-letter queues.",
    category: "DevTools",
    logo_letter: "H",
    website: "https://hyperflow.io",
    location: "Remote / Global",
    owner_id: "2",
    verified: false,
    mrr: 4200,
    active_users: 410,
    growth: 12.0,
    churn: 0.8,
    featured: false,
    stage: "Bootstrapped",
    team_size: "Solo Founder",
    target_market: "Developers",
    tech_stack: "Rust, WebSockets, ClickHouse, Docker",
    demo_url: "https://hyperflow.io/playground",
    created_at: "2026-02-15T15:00:00.000Z",
    updated_at: new Date().toISOString(),
    owner: {
      id: "2",
      user_id: "u2",
      handle: "sarahmaker",
      display_name: "Sarah Chen",
      headline: "Solo software engineer & systems enthusiast",
      bio: "Crafting developer tools and high-throughput network infra in public.",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
      website: "https://sarahchen.dev",
      twitter: "https://x.com/sarahchen_dev",
      github: "https://github.com/sarahchen",
      linkedin: null,
      email: "sarah@hyperflow.io",
      skills: "Rust, Go, Systems, Distributed Queues",
      location: "Seattle, WA",
      created_at: "2026-01-20T09:00:00.000Z",
    },
    follower_count: 94,
  },
];

export const INITIAL_MOCK_MILESTONES: MilestoneWithStartup[] = [
  {
    id: "m1",
    startup_id: "1",
    title: "Surpassed $50k Monthly Recurring Revenue",
    description: "Hit our Q1 milestone ahead of schedule thanks to major enterprise renewals and team tier expansions.",
    category: "revenue",
    metric_label: "MRR",
    metric_value: "$54,000",
    image_url: null,
    link_url: "https://stripe.com",
    source: "stripe",
    verified: true,
    occurred_at: "2026-03-01",
    created_at: "2026-03-01T14:30:00.000Z",
    startup: {
      id: "1",
      name: "Acme Corp",
      slug: "acme-corp",
      logo_letter: "A",
      category: "SaaS",
      verified: true,
    },
    like_count: 42,
  },
  {
    id: "m2",
    startup_id: "2",
    title: "Shipped v2 Autonomous Sandboxing Engine",
    description: "Released deterministic replay runner with 4x faster execution times and full Docker isolation support.",
    category: "launch",
    metric_label: "Release",
    metric_value: "v2.0.0",
    image_url: null,
    link_url: "https://github.com",
    source: "github",
    verified: true,
    occurred_at: "2026-03-12",
    created_at: "2026-03-12T10:15:00.000Z",
    startup: {
      id: "2",
      name: "Beta Labs",
      slug: "beta-labs",
      logo_letter: "B",
      category: "AI",
      verified: true,
    },
    like_count: 28,
  },
  {
    id: "m3",
    startup_id: "1",
    title: "Crossed 3,000 Active Developers",
    description: "Over 3,000 daily active developers are now streaming logs through the instrument cluster.",
    category: "users",
    metric_label: "Active Users",
    metric_value: "3,200",
    image_url: null,
    link_url: null,
    source: "manual",
    verified: true,
    occurred_at: "2026-03-18",
    created_at: "2026-03-18T18:00:00.000Z",
    startup: {
      id: "1",
      name: "Acme Corp",
      slug: "acme-corp",
      logo_letter: "A",
      category: "SaaS",
      verified: true,
    },
    like_count: 19,
  },
];

// Helper functions to manage client-side state persistence
export function getStoredProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read stored profile:", e);
  }
  return DEFAULT_PROFILE;
}

export function saveStoredProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.warn("Could not save profile:", e);
  }
}

export function getStoredStartups(): StartupWithOwner[] {
  if (typeof window === "undefined") return INITIAL_MOCK_STARTUPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STARTUPS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read stored startups:", e);
  }
  return INITIAL_MOCK_STARTUPS;
}

export function saveStoredStartups(startups: StartupWithOwner[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_STARTUPS, JSON.stringify(startups));
  } catch (e) {
    console.warn("Could not save startups:", e);
  }
}

export function getStoredMilestones(): MilestoneWithStartup[] {
  if (typeof window === "undefined") return INITIAL_MOCK_MILESTONES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MILESTONES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read stored milestones:", e);
  }
  return INITIAL_MOCK_MILESTONES;
}

export function saveStoredMilestones(milestones: MilestoneWithStartup[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_MILESTONES, JSON.stringify(milestones));
  } catch (e) {
    console.warn("Could not save milestones:", e);
  }
}

export function resetAllMockData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_PROFILE);
  localStorage.removeItem(STORAGE_KEY_STARTUPS);
  localStorage.removeItem(STORAGE_KEY_MILESTONES);
}

// In-memory aliases for backward compatibility
export const MOCK_STARTUPS: StartupWithOwner[] = INITIAL_MOCK_STARTUPS;
export const MOCK_MILESTONES: MilestoneWithStartup[] = INITIAL_MOCK_MILESTONES;

export const MOCK_STATS = {
  startupCount: 16,
  totalMrr: 168000,
  verifiedShare: 82.5,
};
