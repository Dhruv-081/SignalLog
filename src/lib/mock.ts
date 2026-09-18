import { StartupWithOwner, MilestoneWithStartup } from "@/lib/api";

export const MOCK_STARTUPS: StartupWithOwner[] = [
  {
    id: "1",
    slug: "acme-corp",
    name: "Acme Corp",
    tagline: "The best widgets",
    description: "High quality widgets for everyone.",
    category: "SaaS",
    logo_letter: "A",
    website: "https://acme.com",
    location: "San Francisco",
    owner_id: "1",
    verified: true,
    mrr: 50000,
    active_users: 1000,
    growth: 15,
    churn: 1,
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: {
        id: "1",
        user_id: "u1",
        handle: "acme",
        display_name: "Acme Founder",
        bio: "Founder",
        avatar_url: null,
        website: null,
        twitter: null,
        location: null,
        created_at: new Date().toISOString(),
    },
    follower_count: 150
  },
  {
    id: "2",
    slug: "beta-labs",
    name: "Beta Labs",
    tagline: "Innovative solutions",
    description: "We solve complex problems.",
    category: "AI",
    logo_letter: "B",
    website: "https://beta.com",
    location: "New York",
    owner_id: "2",
    verified: false,
    mrr: 10000,
    active_users: 200,
    growth: 20,
    churn: 2,
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: {
        id: "2",
        user_id: "u2",
        handle: "beta",
        display_name: "Beta Founder",
        bio: "Co-Founder",
        avatar_url: null,
        website: null,
        twitter: null,
        location: null,
        created_at: new Date().toISOString(),
    },
    follower_count: 80
  }
];

export const MOCK_MILESTONES: MilestoneWithStartup[] = [
    {
        id: "m1",
        startup_id: "1",
        title: "Reached $50k MRR",
        description: "We hit our goal of 50k MRR!",
        category: "revenue",
        metric_label: "MRR",
        metric_value: "$50,000",
        image_url: null,
        link_url: null,
        source: "stripe",
        verified: true,
        occurred_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        startup: {
            id: "1",
            name: "Acme Corp",
            slug: "acme-corp",
            logo_letter: "A",
            category: "SaaS",
            verified: true,
        },
        like_count: 10
    }
];

export const MOCK_STATS = {
    startupCount: 12,
    totalMrr: 150000,
    verifiedShare: 75.5
}
