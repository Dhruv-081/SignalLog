import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({
  letter = "S",
  className,
}: {
  letter?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "gradient-signal grid place-items-center rounded-lg font-display font-bold text-primary-foreground",
        className ?? "size-8 text-sm",
      )}
    >
      {letter.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-lg font-semibold tracking-tight">Signallog</span>
    </Link>
  );
}

export function VerifyBadge({
  verified,
  source,
  className,
}: {
  verified: boolean;
  source?: string | null;
  className?: string;
}) {
  const label = verified
    ? source && source !== "manual"
      ? `Verified · ${source}`
      : "Verified"
    : "Self-reported";
  return (
    <span
      className={cn(
        "animate-pop inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
        verified
          ? "bg-verified/15 text-verified ring-verified/30"
          : "bg-demo/15 text-demo ring-demo/30",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function DemoDataNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] text-demo", className)}>
      Demo data — connect Stripe or GitHub to publish verified numbers.
    </p>
  );
}
