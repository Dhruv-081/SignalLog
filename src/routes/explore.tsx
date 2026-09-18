import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

import { PageHeading, SiteShell } from "@/components/site-shell";
import { StartupCard, StartupCardSkeleton } from "@/components/startup-card";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { listStartups, type ExploreFilters } from "@/lib/api";
import { CATEGORIES } from "@/lib/format";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore startups building in public — Signallog" },
      {
        name: "description",
        content:
          "Search and filter startups by category, revenue and momentum. Sort by trending, MRR or recent updates.",
      },
      { property: "og:title", content: "Explore startups building in public" },
      {
        property: "og:description",
        content: "Filter verified startup logs by category, revenue and momentum.",
      },
    ],
  }),
  component: Explore,
});

function Explore() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<ExploreFilters["sort"]>("trending");

  const filters: ExploreFilters = { search, category, verifiedOnly, sort };
  const startups = useQuery({
    queryKey: ["startups", filters],
    queryFn: () => listStartups(filters),
  });

  const trending = (startups.data ?? []).slice(0, 3);

  return (
    <SiteShell>
      <PageHeading
        eyebrow="discover"
        title="Explore startups"
        description="Every page here is a live log. Filter by category, keep only verified numbers, or sort by what is moving fastest."
      />

      <div className="glass rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search startups, taglines, categories"
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as ExploreFilters["sort"])}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Trending growth</SelectItem>
              <SelectItem value="mrr">Highest MRR</SelectItem>
              <SelectItem value="recent">Recently updated</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 md:pl-2">
            <Switch id="verified" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            <Label htmlFor="verified" className="text-xs text-muted-foreground">
              Verified only
            </Label>
          </div>
        </div>
      </div>

      {trending.length > 0 && !search && category === "all" ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Trending now</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {trending.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">
          {startups.data ? `${startups.data.length} startups` : "Startups"}
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {startups.isLoading
            ? Array.from({ length: 6 }).map((_, index) => <StartupCardSkeleton key={index} />)
            : (startups.data ?? []).map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
        </div>
        {startups.isError ? <ErrorState /> : null}
        {startups.data?.length === 0 ? (
          <EmptyState
            title="No startups match those filters"
            description="Try a different category, or clear the verified-only filter."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setVerifiedOnly(false);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : null}
      </section>
    </SiteShell>
  );
}
