import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CryptoMcapData {
  mcap: number;
  changePct: number;
  bars: { date: string; value: number }[];
}

type Period = "1D" | "1W" | "1M";

function fmtMcap(v: number): string {
  if (!v) return "$—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

export function MarketCapTrend() {
  const [period, setPeriod] = useState<Period>("1D");

  const { data, isLoading } = useQuery<CryptoMcapData>({
    queryKey: ["/api/market/crypto-mcap"],
    queryFn: () => fetch("/api/market/crypto-mcap", { credentials: "include" }).then(r => r.json()),
    staleTime: 120_000,
    retry: false,
  });

  const positive = (data?.changePct ?? 0) >= 0;
  const maxVal = data?.bars.length ? Math.max(...data.bars.map(b => b.value)) : 1;
  const activeIdx = data?.bars.length ? data.bars.length - 1 : -1;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-bold leading-snug">Global Market<br />Cap</CardTitle>
          <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5">
            {(["1D", "1W", "1M"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "text-[11px] font-semibold px-2 py-1 rounded-md transition-all",
                  period === p
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-8 w-40 mt-2" />
        ) : (
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold tabular-nums text-primary">
              {fmtMcap(data?.mcap ?? 0)}
            </span>
            <span className={cn(
              "text-xs font-semibold px-1.5 py-0.5 rounded-md",
              positive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            )}>
              {positive ? "+" : ""}{(data?.changePct ?? 0).toFixed(2)}%
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-2 pb-3">
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={data?.bars ?? []} barSize={14} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <Tooltip
                cursor={false}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="text-[11px] bg-card border border-border rounded px-2 py-1 shadow">
                      <span className="text-muted-foreground">{payload[0].payload.date}: </span>
                      <span className="font-semibold text-foreground">{fmtMcap(payload[0].value as number)}</span>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {(data?.bars ?? []).map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === activeIdx ? "#4CAF50" : "rgba(76,175,80,0.2)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
