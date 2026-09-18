import { cn } from "@/lib/utils";

export function MetricTile({
  label,
  value,
  delta,
  tone = "verified",
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "verified" | "demo" | "muted";
  className?: string;
}) {
  return (
    <div className={cn("glass lift rounded-xl p-4", className)}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="num mt-1 text-2xl font-bold text-foreground">{value}</div>
      {delta ? (
        <div
          className={cn(
            "num mt-1 text-xs",
            tone === "verified" && "text-verified",
            tone === "demo" && "text-demo",
            tone === "muted" && "text-muted-foreground",
          )}
        >
          {delta}
        </div>
      ) : null}
    </div>
  );
}
