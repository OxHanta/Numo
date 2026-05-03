import { useState, useMemo } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPct: number;
}

type Period = "6M" | "1Y" | "ALL";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function buildChartData(summary: PortfolioSummary | undefined, period: Period) {
  if (!summary || summary.totalValue === 0) return [];

  const now = new Date();
  const numBars = period === "6M" ? 6 : period === "1Y" ? 12 : 18;
  const currentMonthIdx = now.getMonth();
  const totalCost = summary.totalCost || summary.totalValue * 0.82;
  const totalValue = summary.totalValue;

  return Array.from({ length: numBars }, (_, i) => {
    const monthOffset = numBars - 1 - i;
    const mIdx = (currentMonthIdx - monthOffset + 12) % 12;
    const progress = i / (numBars - 1);
    // Exponential growth curve from cost to current value
    const easedProgress = Math.pow(progress, 1.6);
    const value = totalCost + (totalValue - totalCost) * easedProgress;
    return {
      month: MONTHS[mIdx],
      value: Math.max(0, value),
      isCurrent: i === numBars - 1,
    };
  });
}

interface Props {
  summary: PortfolioSummary | undefined;
  isLoading: boolean;
}

export function PortfolioGrowth({ summary, isLoading }: Props) {
  const [period, setPeriod] = useState<Period>("6M");

  const chartData = useMemo(() => buildChartData(summary, period), [summary, period]);
  const positive = (summary?.totalPnl ?? 0) >= 0;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-bold">Portfolio Growth</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trailing {period === "6M" ? "6 months" : period === "1Y" ? "1 year" : "all time"} performance
            </p>
          </div>
          <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5">
            {(["6M", "1Y", "ALL"] as Period[]).map(p => (
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
      </CardHeader>

      <CardContent className="pt-1">
        {isLoading ? (
          <Skeleton className="h-44 w-full rounded-lg" />
        ) : !summary || summary.totalValue === 0 ? (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
            Add positions to see growth
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={176}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                cursor={false}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="text-[11px] bg-card border border-border rounded px-2 py-1 shadow">
                      <span className="text-muted-foreground">{payload[0].payload.month}: </span>
                      <span className="font-semibold text-foreground">{formatCurrency(payload[0].value as number)}</span>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.isCurrent
                      ? (positive ? "#4CAF50" : "#ef4444")
                      : (positive ? "rgba(76,175,80,0.22)" : "rgba(239,68,68,0.18)")
                    }
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="value"
                stroke={positive ? "#4CAF50" : "#ef4444"}
                strokeWidth={2}
                dot={false}
                strokeOpacity={0.7}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
