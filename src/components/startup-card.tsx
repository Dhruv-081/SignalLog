import { Link } from "@tanstack/react-router";

import { LogoMark, VerifyBadge } from "@/components/brand";
import type { StartupWithOwner } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";

export function StartupCard({ startup }: { startup: StartupWithOwner }) {
  return (
    <Link
      to="/startups/$slug"
      params={{ slug: startup.slug }}
      className="glass lift block rounded-2xl p-5"
    >
      <div className="flex items-center gap-3">
        <LogoMark letter={startup.logo_letter} className="size-10 text-base" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-display font-semibold">{startup.name}</span>
            <VerifyBadge verified={startup.verified} />
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {startup.category} · {formatNumber(startup.follower_count)} followers
          </div>
        </div>
        <span className="num ml-auto text-xs text-verified">+{startup.growth}%</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{startup.tagline}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] text-muted-foreground">MRR</div>
          <div className="num text-base font-bold">{formatCurrency(startup.mrr)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground">Users</div>
          <div className="num text-base font-bold">{formatNumber(startup.active_users)}</div>
        </div>
      </div>
    </Link>
  );
}

export function StartupCardSkeleton() {
  return <div className="glass h-[190px] animate-pulse rounded-2xl" />;
}
