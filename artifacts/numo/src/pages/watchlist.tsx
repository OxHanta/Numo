import { useState, useCallback } from "react";
import { useGetWatchlist, useSearchAssets, useAddToWatchlist, useRemoveFromWatchlist } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Trash2, ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AssetTypeBadge } from "@/components/asset-type-badge";

export default function Watchlist() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { data: watchlist, isLoading: loadingWatchlist } = useGetWatchlist({ query: { queryKey: ["/api/watchlist"] } });

  const { data: searchResults, isLoading: loadingSearch } = useSearchAssets(
    { q: debouncedSearch },
    { query: { enabled: debouncedSearch.length > 1, queryKey: ["/api/assets/search", { q: debouncedSearch }] } }
  );

  const addMutation = useAddToWatchlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
        setSearchQuery("");
      }
    }
  });

  const removeMutation = useRemoveFromWatchlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      }
    }
  });

  const handleAdd = (asset: any) => {
    addMutation.mutate({ data: { ticker: asset.ticker, name: asset.name, assetType: asset.assetType } });
  };

  const handleRemove = (ticker: string) => {
    removeMutation.mutate({ ticker });
  };

  const watchlistArray = Array.isArray(watchlist) ? watchlist : [];
  const searchResultsArray = Array.isArray(searchResults) && searchResults.length > 0 ? searchResults : null;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">Track assets</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Watchlist</h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search stocks, crypto, ETFs to add..."
            className="pl-9 h-11 bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
        </div>

        <AnimatePresence>
          {isSearchFocused && debouncedSearch.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 max-h-[300px] overflow-y-auto"
            >
              {loadingSearch ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : searchResultsArray ? (
                <div className="py-2">
                  {searchResultsArray.map((asset) => (
                    <div key={asset.ticker} className="px-4 py-3 hover:bg-secondary flex items-center justify-between group">
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {asset.ticker}
                          <AssetTypeBadge type={asset.assetType} />
                        </div>
                        <div className="text-xs text-muted-foreground">{asset.name}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={addMutation.isPending}
                        onClick={() => handleAdd(asset)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No results found for "{debouncedSearch}"</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Watchlist */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-base">Tracked Assets</h2>
          <span className="text-xs text-muted-foreground">
            {watchlistArray.length} {watchlistArray.length === 1 ? "asset" : "assets"}
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-xs font-semibold tracking-wide">
              <tr>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3 text-right">Price</th>
                <th className="px-6 py-3 text-right">24h Change</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingWatchlist ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : watchlistArray.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-muted" />
                      <p>Your watchlist is empty.</p>
                      <p className="text-xs">Search for an asset above to add it.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                watchlistArray.map((item, i) => {
                  const isPositive = (item.priceChangePct || 0) >= 0;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-secondary/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <Link href={`/assets/${item.ticker}`} className="flex items-center gap-3 block">
                          <div className="flex flex-col">
                            <span className="font-bold text-base group-hover:text-primary transition-colors">{item.ticker}</span>
                            <span className="text-xs text-muted-foreground">{item.name}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right font-medium tabular-nums">
                        {formatCurrency(item.currentPrice || 0)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={cn(
                          "inline-flex items-center gap-1 font-medium px-2 py-1 rounded-md tabular-nums",
                          isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        )}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {formatPercentage(item.priceChangePct || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/assets/${item.ticker}`}>
                              <DropdownMenuItem className="cursor-pointer">View Asset</DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                              onClick={() => handleRemove(item.ticker)}
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden">
          {loadingWatchlist ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-4 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="space-y-1.5 items-end flex flex-col">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : watchlistArray.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Search className="w-8 h-8 text-muted" />
                <p className="text-sm">Your watchlist is empty.</p>
                <p className="text-xs">Search for an asset above to add it.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {watchlistArray.map((item, i) => {
                const isPositive = (item.priceChangePct || 0) >= 0;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-4 py-4 flex items-center justify-between gap-3"
                  >
                    <Link href={`/assets/${item.ticker}`} className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{item.ticker}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{item.name}</div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-medium text-sm tabular-nums">{formatCurrency(item.currentPrice || 0)}</div>
                        <div className={cn(
                          "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums mt-0.5",
                          isPositive ? "text-success" : "text-destructive"
                        )}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {formatPercentage(item.priceChangePct || 0)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/assets/${item.ticker}`}>
                            <DropdownMenuItem className="cursor-pointer">View Asset</DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                            onClick={() => handleRemove(item.ticker)}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
