import { TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface SectorData {
  key: string;
  label: string;
  changePct: number;
}

interface Props {
  sectors: SectorData[];
  isLoading: boolean;
}

export function TrendingInsight({ sectors, isLoading }: Props) {
  const sorted = sectors.length ? [...sectors].sort((a, b) => b.changePct - a.changePct) : [];
  const leader = sorted[0];
  const laggard = sorted[sorted.length - 1];
  const allPositive = sectors.length > 0 && sectors.every(s => s.changePct >= 0);
  const allNegative = sectors.length > 0 && sectors.every(s => s.changePct <= 0);

  let title = "Sector Heatmap";
  let body = "Markets are active. View sector analysis.";

  if (!isLoading && leader) {
    if (allPositive) {
      title = "Broad Market Rally";
      body = `All sectors in the green. ${leader.label} leads with +${leader.changePct.toFixed(1)}%.`;
    } else if (allNegative) {
      title = "Market Pullback";
      body = `Broad selling pressure. ${laggard?.label} down the most at ${laggard?.changePct.toFixed(1)}%.`;
    } else {
      title = "Sector Rotation";
      body = `${leader.label} and ${sorted[1]?.label ?? "Energy"} sectors are leading today's market performance.`;
    }
  }

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden flex flex-col gap-4"
      style={{ background: "linear-gradient(135deg, rgba(76,175,80,0.12) 0%, rgba(76,175,80,0.05) 100%)", border: "1px solid rgba(76,175,80,0.2)" }}
    >
      {/* Decorative background icon */}
      <div className="absolute top-3 right-4 opacity-[0.07]">
        <TrendingUp className="w-20 h-20 text-primary" strokeWidth={1.5} />
      </div>

      {/* Icon bubble */}
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>

      <div>
        <h3 className="font-bold text-base text-foreground mb-1">{isLoading ? "Loading..." : title}</h3>
        <p className={cn(
          "text-sm leading-relaxed",
          isLoading ? "text-muted-foreground/40 animate-pulse" : "text-muted-foreground"
        )}>
          {isLoading ? "Analyzing market conditions..." : body}
        </p>
      </div>

      <Link href="/watchlist">
        <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-semibold text-sm rounded-xl py-3 transition-all">
          View Analysis <ArrowRight className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
}
