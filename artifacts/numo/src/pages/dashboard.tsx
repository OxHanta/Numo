import { useGetPortfolioSummary, useGetWatchlistMovers, useGetMarketNews } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Clock, Newspaper, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetPortfolioSummary({ query: { queryKey: ["/api/portfolio/summary"] } });
  const { data: movers, isLoading: loadingMovers } = useGetWatchlistMovers({ query: { queryKey: ["/api/watchlist/movers"] } });
  const { data: newsData, isLoading: loadingNews } = useGetMarketNews({ query: { queryKey: ["/api/market/news"] } });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-[150px]" /> : (
              <div className="text-3xl font-bold">{formatCurrency(summary?.totalValue || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Day Change</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-[150px]" /> : (
              <div className={cn("text-3xl font-bold flex items-center gap-2", 
                (summary?.dayChange || 0) >= 0 ? "text-success" : "text-destructive"
              )}>
                {(summary?.dayChange || 0) >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                {formatCurrency(summary?.dayChange || 0)}
                <span className="text-lg opacity-80">({formatPercentage(summary?.dayChangePct || 0)})</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">All-Time P&L</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-[150px]" /> : (
              <div className={cn("text-3xl font-bold flex items-center gap-2", 
                (summary?.totalPnl || 0) >= 0 ? "text-success" : "text-destructive"
              )}>
                {(summary?.totalPnl || 0) >= 0 ? "+" : ""}{formatCurrency(summary?.totalPnl || 0)}
                <span className="text-lg opacity-80">({formatPercentage(summary?.totalPnlPct || 0)})</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Watchlist Movers */}
        <Card className="col-span-1 border border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Watchlist Movers</CardTitle>
            <Link href="/watchlist" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Top Gainers
                </h4>
                {loadingMovers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : movers?.gainers?.length ? (
                  <div className="space-y-2">
                    {movers.gainers.slice(0, 3).map(asset => (
                      <Link key={asset.ticker} href={`/assets/${asset.ticker}`}>
                        <div className="flex justify-between items-center p-2 rounded-md hover:bg-secondary transition-colors cursor-pointer">
                          <div>
                            <div className="font-bold">{asset.ticker}</div>
                            <div className="text-xs text-muted-foreground">{asset.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(asset.currentPrice || 0)}</div>
                            <div className="text-sm text-success">+{formatPercentage(asset.priceChangePct || 0)}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-2">No gainers today.</div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" /> Top Losers
                </h4>
                {loadingMovers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : movers?.losers?.length ? (
                  <div className="space-y-2">
                    {movers.losers.slice(0, 3).map(asset => (
                      <Link key={asset.ticker} href={`/assets/${asset.ticker}`}>
                        <div className="flex justify-between items-center p-2 rounded-md hover:bg-secondary transition-colors cursor-pointer">
                          <div>
                            <div className="font-bold">{asset.ticker}</div>
                            <div className="text-xs text-muted-foreground">{asset.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(asset.currentPrice || 0)}</div>
                            <div className="text-sm text-destructive">{formatPercentage(asset.priceChangePct || 0)}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-2">No losers today.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market News */}
        <Card className="col-span-1 border border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Newspaper className="w-5 h-5" /> Market News
            </CardTitle>
            <Link href="/news" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {loadingNews ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : newsData?.length ? (
              <div className="space-y-4">
                {newsData.slice(0, 4).map((article, i) => (
                  <motion.a 
                    key={article.id} 
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="block group"
                  >
                    <div className="flex flex-col space-y-1 pb-4 border-b border-border last:border-0">
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                        {article.headline}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium">{article.source}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(article.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent news available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
