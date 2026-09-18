export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toLocaleString("en-US")}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "▲" : value < 0 ? "▼" : "•";
  return `${sign} ${Math.abs(value).toFixed(1)}%`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLongDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function relativeTime(value: string | null): string {
  if (!value) return "never";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export const CATEGORIES = [
  "Analytics",
  "Infrastructure",
  "Productivity",
  "Security",
  "Fintech",
  "SaaS",
  "AI",
  "Consumer",
  "Devtools",
  "Marketplace",
];

export const MILESTONE_CATEGORIES = [
  { value: "revenue", label: "Revenue" },
  { value: "users", label: "Users" },
  { value: "product", label: "Product" },
  { value: "launch", label: "Launch" },
  { value: "funding", label: "Funding" },
  { value: "team", label: "Team" },
];
