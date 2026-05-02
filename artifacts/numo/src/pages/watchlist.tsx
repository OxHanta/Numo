import { useState, useRef, useCallback } from "react";
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">Track assets</p>
          <h1 className="text-3xl font-bold tracking-tight">Watchlist</h1>
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
        
        {/* Search Results Dropdown */}
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
              ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((asset) => (
                    <div key={asset.ticker} className="px-4 py-3 hover:bg-secondary flex items-center justify-between group">
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {asset.ticker}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">{asset.assetType}</span>
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

      {/* Watchlist Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-base">Tracked Assets</h2>
          <span className="text-xs text-muted-foreground">
            {Array.isArray(watchlist) ? watchlist.length : 0} {Array.isArray(watchlist) && watchlist.length === 1 ? "asset" : "assets"}
          </span>
        </div>
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
            ) : !Array.isArray(watchlist) || watchlist.length === 0 ? (
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
              watchlist.map((item, i) => {
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
    </div>
  );
}
