import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Position {
  assetType: string;
  currentValue?: number | null;
  ticker: string;
}

interface Props {
  positions: Position[];
  isLoading?: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  stock:  { label: "US Stocks", color: "#4CAF50", bg: "bg-emerald-500/15" },
  etf:    { label: "ETFs",      color: "#22d3ee", bg: "bg-cyan-500/15" },
  crypto: { label: "Crypto",    color: "#f59e0b", bg: "bg-amber-500/15" },
  ngx:    { label: "NGX",       color: "#a78bfa", bg: "bg-violet-500/15" },
};

const FALLBACK: { label: string; color: string; bg: string } = {
  label: "Other", color: "#6b7280", bg: "bg-zinc-500/15",
};

function getConfig(type: string) {
  return TYPE_CONFIG[type.toLowerCase()] ?? FALLBACK;
}

export function AssetAllocationChart({ positions, isLoading }: Props) {
  const slices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of positions) {
      const key = p.assetType?.toLowerCase() ?? "other";
      map[key] = (map[key] ?? 0) + (p.currentValue ?? 0);
    }
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([type, value]) => ({
        type,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
        ...getConfig(type),
      }));
  }, [positions]);

  const total = useMemo(
    () => slices.reduce((s, sl) => s + sl.value, 0),
    [slices],
  );

  if (isLoading) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-44">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (slices.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-44 text-sm text-muted-foreground">
          Add positions to see your allocation.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut */}
          <div className="relative shrink-0 w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={slices.length > 1 ? 3 : 0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {slices.map((sl) => (
                    <Cell key={sl.type} fill={sl.color} opacity={0.92} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
                        <p className="font-bold text-foreground">{payload[0].payload.label}</p>
                        <p className="text-muted-foreground mt-0.5">
                          {formatCurrency(payload[0].value as number)}{" "}
                          <span className="font-semibold text-foreground">
                            ({payload[0].payload.pct.toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="text-sm font-bold tabular-nums text-foreground mt-0.5">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2.5 w-full min-w-0">
            {slices.map((sl) => (
              <div key={sl.type} className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: sl.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{sl.label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: sl.color }}>
                      {sl.pct.toFixed(1)}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${sl.pct}%`, background: sl.color, opacity: 0.8 }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                    {formatCurrency(sl.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
