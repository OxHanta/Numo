import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency";
import { formatPercentage } from "@/lib/format";
import { Bitcoin, Building2, TrendingUp } from "lucide-react";

interface Asset {
  ticker: string;
  name: string;
  assetType: string;
  currentPrice?: number;
  priceChangePct?: number;
}

interface Props {
  gainers: Asset[];
  isLoading: boolean;
}

function AssetIcon({ ticker, assetType }: { ticker: string; assetType: string }) {
  const letter = ticker[0]?.toUpperCase() ?? "?";
  const isCrypto = assetType === "crypto";
  const isNGX = assetType === "ngx";

  return (
    <div className={cn(
      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
      isCrypto ? "bg-amber-500/15 text-amber-400" :
      isNGX ? "bg-emerald-500/15 text-emerald-400" :
      "bg-primary/10 text-primary"
    )}>
      {isCrypto && ticker === "BTC" ? <Bitcoin className="w-4 h-4" /> :
       isCrypto ? <TrendingUp className="w-4 h-4" /> :
       isNGX ? <Building2 className="w-4 h-4" /> :
       letter}
    </div>
  );
}

export function TopPerformers({ gainers, isLoading }: Props) {
  const { formatPrice } = useCurrency();
  const top = gainers.slice(0, 3);

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">Top Performing Assets</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-0 pb-0">
        {isLoading ? (
          <div className="divide-y divide-border/60 px-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 my-3 rounded-lg" />)}
          </div>
        ) : top.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Add assets to your watchlist to see top performers.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {top.map((asset) => (
              <Link key={asset.ticker} href={`/assets/${asset.ticker}`}>
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer group">
                  <AssetIcon ticker={asset.ticker} assetType={asset.assetType} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
                      {asset.name || asset.ticker}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{asset.ticker}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm tabular-nums">
                      {formatPrice(asset.currentPrice ?? 0, asset.assetType)}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-400 tabular-nums mt-0.5">
                      +{formatPercentage(asset.priceChangePct ?? 0)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
