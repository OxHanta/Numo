import { useGetPortfolioSummary, useGetWatchlistMovers, useGetMarketNews } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { useCurrency } from "@/context/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Clock, Newspaper, ArrowRight, BarChart2, Wallet } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useUser();
  const { formatPrice } = useCurrency();
  const { data: summary, isLoading: loadingSummary } = useGetPortfolioSummary({ query: { queryKey: ["/api/portfolio/summary"] } });
  const { data: movers, isLoading: loadingMovers } = useGetWatchlistMovers({ query: { queryKey: ["/api/watchlist/movers"] } });
  const { data: newsData, isLoading: loadingNews } = useGetMarketNews({ query: { queryKey: ["/api/market/news"] } });

  const dayChangePositive = (summary?.dayChange || 0) >= 0;
  const pnlPositive = (summary?.totalPnl || 0) >= 0;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{getGreeting()}{user?.firstName ? `, ${user.firstName}` : ""}</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Total Value */}
        <Card className="bg-card border border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Value</CardTitle>
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-[140px]" />
            ) : (
              <div className="text-2xl md:text-3xl font-bold tracking-tight">{formatCurrency(summary?.totalValue || 0)}</div>
            )}
          </CardContent>
        </Card>

        {/* Day Change */}
        <Card className={cn("bg-card border border-border relative overflow-hidden")}>
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none",
            dayChangePositive ? "from-success/5" : "from-destructive/5"
          )} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Day Change</CardTitle>
            <div className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center",
              dayChangePositive ? "bg-success/10" : "bg-destructive/10"
            )}>
              {dayChangePositive
                ? <TrendingUp className="w-4 h-4 text-success" />
                : <TrendingDown className="w-4 h-4 text-destructive" />}
            </div>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-[140px]" />
            ) : (
              <div className={cn("text-2xl md:text-3xl font-bold tracking-tight flex items-baseline gap-2",
                dayChangePositive ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(summary?.dayChange || 0)}
                <span className="text-sm md:text-base font-semibold opacity-70">
                  {formatPercentage(summary?.dayChangePct || 0)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All-Time P&L */}
        <Card className={cn("bg-card border border-border relative overflow-hidden")}>
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none",
            pnlPositive ? "from-success/5" : "from-destructive/5"
          )} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All-Time P&L</CardTitle>
            <div className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center",
              pnlPositive ? "bg-success/10" : "bg-destructive/10"
            )}>
              <BarChart2 className={cn("w-4 h-4", pnlPositive ? "text-success" : "text-destructive")} />
            </div>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-8 w-[140px]" />
            ) : (
              <div className={cn("text-2xl md:text-3xl font-bold tracking-tight flex items-baseline gap-2",
                pnlPositive ? "text-success" : "text-destructive"
              )}>
                {pnlPositive ? "+" : ""}{formatCurrency(summary?.totalPnl || 0)}
                <span className="text-sm md:text-base font-semibold opacity-70">
                  {formatPercentage(summary?.totalPnlPct || 0)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lower grid — stack on mobile, 2-col on md+ */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        {/* Watchlist Movers */}
        <Card className="col-span-1 border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Watchlist Movers</CardTitle>
            <Link href="/watchlist" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-5">
              {/* Gainers */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-success">Top Gainers</span>
                </div>
                {loadingMovers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : Array.isArray(movers?.gainers) && movers.gainers.length > 0 ? (
                  <div className="space-y-1">
                    {movers.gainers.slice(0, 3).map(asset => (
                      <Link key={asset.ticker} href={`/assets/${asset.ticker}`}>
                        <div className="flex justify-between items-center px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer group">
                          <div>
                            <div className="font-bold text-sm group-hover:text-primary transition-colors">{asset.ticker}</div>
                            <div className="text-[11px] text-muted-foreground">{asset.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm tabular-nums">{formatPrice(asset.currentPrice || 0, asset.assetType)}</div>
                            <div className="text-xs font-semibold text-success tabular-nums">
                              +{formatPercentage(asset.priceChangePct || 0)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-2 px-3">No gainers today.</div>
                )}
              </div>

              <div className="h-px bg-border/60" />

              {/* Losers */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-destructive">Top Losers</span>
                </div>
                {loadingMovers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : Array.isArray(movers?.losers) && movers.losers.length > 0 ? (
                  <div className="space-y-1">
                    {movers.losers.slice(0, 3).map(asset => (
                      <Link key={asset.ticker} href={`/assets/${asset.ticker}`}>
                        <div className="flex justify-between items-center px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer group">
                          <div>
                            <div className="font-bold text-sm group-hover:text-primary transition-colors">{asset.ticker}</div>
                            <div className="text-[11px] text-muted-foreground">{asset.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm tabular-nums">{formatPrice(asset.currentPrice || 0, asset.assetType)}</div>
                            <div className="text-xs font-semibold text-destructive tabular-nums">
                              {formatPercentage(asset.priceChangePct || 0)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-2 px-3">No losers today.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market News */}
        <Card className="col-span-1 border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-muted-foreground" /> Market News
            </CardTitle>
            <Link href="/news" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingNews ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : Array.isArray(newsData) && newsData.length > 0 ? (
              <div className="divide-y divide-border/60">
                {newsData.slice(0, 4).map((article, i) => (
                  <motion.a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="block group py-3 first:pt-0 last:pb-0"
                  >
                    <h4 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                      {article.headline}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground/60">{article.source}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent news available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
