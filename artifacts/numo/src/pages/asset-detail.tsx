import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetQuote, useGetChartData, useGetMarketNews } from "@workspace/api-client-react";
import { PriceChart } from "@/components/price-chart";
import { formatPercentage } from "@/lib/format";
import { useCurrency } from "@/context/currency";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"] as const;
type Timeframe = typeof TIMEFRAMES[number];

export default function AssetDetail() {
  const [, params] = useRoute("/assets/:ticker");
  const ticker = params?.ticker?.toUpperCase() || "";
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const { formatPrice } = useCurrency();
  const detectedAssetType = /\.(LG|LA|NGX)$/i.test(ticker) ? "ngx" : "stock";

  const { data: quote, isLoading: loadingQuote } = useGetQuote(
    ticker,
    { query: { enabled: !!ticker, queryKey: ["/api/assets/quote", ticker] } }
  );

  const { data: chartData, isLoading: loadingChart } = useGetChartData(
    ticker,
    { timeframe },
    { query: { enabled: !!ticker, queryKey: ["/api/assets/chart", ticker, timeframe] } }
  );

  const { data: newsData, isLoading: loadingNews } = useGetMarketNews(
    { query: { queryKey: ["/api/market/news"] } }
  );
  
  // Filter news for this asset if possible, else just show market news
  const assetNews = newsData?.filter(a => a.tickers?.includes(ticker)) || newsData?.slice(0, 5) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">{ticker}</h1>
              <div className="text-muted-foreground">Asset Details</div>
            </div>
            
            {loadingQuote ? (
              <div className="text-right">
                <Skeleton className="h-10 w-32 ml-auto mb-2" />
                <Skeleton className="h-6 w-24 ml-auto" />
              </div>
            ) : quote ? (
              <div className="text-left md:text-right">
                <div className="text-4xl font-bold tracking-tight">{formatPrice(quote.price, detectedAssetType)}</div>
                <div className={cn("text-lg font-medium flex items-center gap-2 md:justify-end", 
                  quote.change >= 0 ? "text-success" : "text-destructive"
                )}>
                  {quote.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {quote.change >= 0 ? "+" : ""}{formatPrice(quote.change, detectedAssetType)} ({formatPercentage(quote.changePct)})
                </div>
              </div>
            ) : null}
          </div>

          {/* Chart controls */}
          <div className="flex items-center gap-2 bg-secondary/50 p-1.5 rounded-lg w-fit">
            {TIMEFRAMES.map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                size="sm"
                className={cn("h-7 px-3 text-xs", timeframe !== tf && "text-muted-foreground hover:text-foreground")}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>

          {/* Chart Area */}
          <div className="h-[500px] border border-border rounded-xl bg-card overflow-hidden">
            <PriceChart data={chartData} isLoading={loadingChart} />
          </div>
        </div>

        {/* Sidebar Data */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-lg border-b border-border pb-2">Market Stats</h3>
            {loadingQuote ? (
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : quote ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Previous Close</span>
                  <span className="font-medium tabular-nums">{formatPrice(quote.previousClose, detectedAssetType)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Open</span>
                  <span className="font-medium tabular-nums">{formatPrice(quote.open, detectedAssetType)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-border/50 pt-2">
                  <span className="text-muted-foreground">Day's High</span>
                  <span className="font-medium tabular-nums">{formatPrice(quote.high, detectedAssetType)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Day's Low</span>
                  <span className="font-medium tabular-nums">{formatPrice(quote.low, detectedAssetType)}</span>
                </div>
                {quote.volume && (
                  <div className="flex justify-between items-center py-1 border-t border-border/50 pt-2">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-medium tabular-nums">{(quote.volume / 1000000).toFixed(2)}M</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-4 mt-4 border-t border-border text-center">
                  Last updated {new Date(quote.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-lg border-b border-border pb-2 mb-4">Recent News</h3>
            {loadingNews ? (
               <div className="space-y-4">
               {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
             </div>
            ) : assetNews?.length ? (
              <div className="space-y-4">
                {assetNews.map((article: any) => (
                  <a 
                    key={article.id} 
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="flex flex-col space-y-1">
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {article.headline}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="font-medium">{article.source}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(article.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">No recent news found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
