import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SectorData {
  key: string;
  label: string;
  ticker: string;
  changePct: number;
  price: number;
}

function tileStyle(pct: number): { bg: string; border: string; label: string; value: string } {
  if (pct >= 2)   return { bg: "bg-emerald-900/70", border: "border-emerald-700/60", label: "text-emerald-300/70", value: "text-emerald-300" };
  if (pct >= 0.1) return { bg: "bg-emerald-900/35", border: "border-emerald-800/40", label: "text-emerald-400/60", value: "text-emerald-400" };
  if (pct >= -2)  return { bg: "bg-rose-900/35",    border: "border-rose-800/40",    label: "text-rose-400/60",   value: "text-rose-400" };
  return             { bg: "bg-rose-900/60",    border: "border-rose-700/60",    label: "text-rose-300/70",   value: "text-rose-300" };
}

export function SectorHeatmap() {
  const { data, isLoading } = useQuery<SectorData[]>({
    queryKey: ["/api/market/sectors"],
    queryFn: () => fetch("/api/market/sectors", { credentials: "include" }).then(r => r.json()),
    staleTime: 60_000,
    retry: false,
  });

  const lead = data ? [...data].sort((a, b) => b.changePct - a.changePct)[0] : null;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">Sector Heatmap</CardTitle>
        {lead && !isLoading && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {lead.label} leads with {lead.changePct > 0 ? "+" : ""}{lead.changePct.toFixed(1)}%
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(data ?? []).map(sector => {
              const style = tileStyle(sector.changePct);
              return (
                <div
                  key={sector.key}
                  className={cn(
                    "rounded-xl border px-3 py-3 flex flex-col justify-between gap-1.5 transition-all",
                    style.bg, style.border
                  )}
                >
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", style.label)}>
                    {sector.key}
                  </span>
                  <span className={cn("text-xl font-bold tabular-nums leading-none", style.value)}>
                    {sector.changePct >= 0 ? "+" : ""}{sector.changePct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
