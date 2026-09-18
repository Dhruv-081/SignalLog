import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MetricPoint } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";

type Metric = "mrr" | "active_users";

export function GrowthChart({
  points,
  metric = "mrr",
  height = 220,
}: {
  points: MetricPoint[];
  metric?: Metric;
  height?: number;
}) {
  const data = points.map((point) => ({
    label: new Date(point.period).toLocaleDateString("en-US", { month: "short" }),
    value: metric === "mrr" ? point.mrr : point.active_users,
    verified: point.verified,
  }));

  const format = (value: number) =>
    metric === "mrr" ? formatCurrency(value) : formatNumber(value);

  if (!data.length) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground"
        style={{ height }}
      >
        No metric history yet.
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={54}
            tickFormatter={format}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
            formatter={(value: number) => [format(value), metric === "mrr" ? "MRR" : "Users"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--signal)"
            strokeWidth={2.5}
            fill="url(#signalFill)"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--verified)"
            strokeWidth={0}
            dot={{ r: 2, fill: "var(--verified)" }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 bg-signal" /> Verified
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 border-t border-dashed border-demo" /> Demo
      </span>
    </div>
  );
}
