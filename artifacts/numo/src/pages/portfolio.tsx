import { useState } from "react";
import { useGetPortfolioPositions, useGetPortfolioSummary, useAddPortfolioPosition, useUpdatePortfolioPosition, useDeletePortfolioPosition, useSearchAssets } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, TrendingUp, TrendingDown, Plus, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";

export default function Portfolio() {
  const queryClient = useQueryClient();
  const { data: summary, isLoading: loadingSummary } = useGetPortfolioSummary({ query: { queryKey: ["/api/portfolio/summary"] } });
  const { data: positions, isLoading: loadingPositions } = useGetPortfolioPositions({ query: { queryKey: ["/api/portfolio/positions"] } });
  
  const [isAddOpen, setIsAddOpen] = useState(false);

  const deleteMutation = useDeletePortfolioPosition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio/positions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
      }
    }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Position
        </Button>
      </div>

      {/* Portfolio Summary - Similar to dashboard but full width */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-2">Total Value</div>
          {loadingSummary ? <Skeleton className="h-8 w-full max-w-[150px]" /> : (
            <div className="text-3xl font-bold">{formatCurrency(summary?.totalValue || 0)}</div>
          )}
        </div>
        <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-2">Total Cost</div>
          {loadingSummary ? <Skeleton className="h-8 w-full max-w-[150px]" /> : (
            <div className="text-3xl font-bold">{formatCurrency(summary?.totalCost || 0)}</div>
          )}
        </div>
        <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-2">Day Change</div>
          {loadingSummary ? <Skeleton className="h-8 w-full max-w-[150px]" /> : (
            <div className={cn("text-3xl font-bold flex items-center gap-2", 
              (summary?.dayChange || 0) >= 0 ? "text-success" : "text-destructive"
            )}>
              {(summary?.dayChange || 0) >= 0 ? "+" : ""}{formatCurrency(summary?.dayChange || 0)}
            </div>
          )}
        </div>
        <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-2">Total Return</div>
          {loadingSummary ? <Skeleton className="h-8 w-full max-w-[150px]" /> : (
            <div className={cn("text-3xl font-bold flex items-center gap-2", 
              (summary?.totalPnl || 0) >= 0 ? "text-success" : "text-destructive"
            )}>
              {(summary?.totalPnl || 0) >= 0 ? "+" : ""}{formatCurrency(summary?.totalPnl || 0)}
              <span className="text-lg opacity-80">({formatPercentage(summary?.totalPnlPct || 0)})</span>
            </div>
          )}
        </div>
      </div>

      {/* Positions Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden mt-8">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Asset</th>
              <th className="px-6 py-4 text-right">Holdings</th>
              <th className="px-6 py-4 text-right">Avg Cost</th>
              <th className="px-6 py-4 text-right">Current Price</th>
              <th className="px-6 py-4 text-right">Value</th>
              <th className="px-6 py-4 text-right">Unrealised P&L</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingPositions ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-10 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-24 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                </tr>
              ))
            ) : positions?.length === 0 ? (
               <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Briefcase className="w-8 h-8 text-muted" />
                    <p>Your portfolio is empty.</p>
                    <Button variant="outline" onClick={() => setIsAddOpen(true)} className="mt-2">Add your first position</Button>
                  </div>
                </td>
              </tr>
            ) : (
              positions?.map((pos, i) => {
                const isPositive = (pos.unrealisedPnlPct || 0) >= 0;
                return (
                  <motion.tr 
                    key={pos.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-secondary/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/assets/${pos.ticker}`} className="block">
                        <div className="font-bold group-hover:text-primary transition-colors">{pos.ticker}</div>
                        <div className="text-xs text-muted-foreground">{pos.name}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{pos.quantity}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{formatCurrency(pos.avgBuyPrice)}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(pos.currentPrice || 0)}</td>
                    <td className="px-6 py-4 text-right font-bold">{formatCurrency(pos.currentValue || 0)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className={cn(
                        "flex flex-col items-end",
                        isPositive ? "text-success" : "text-destructive"
                      )}>
                        <span className="font-bold">{isPositive ? "+" : ""}{formatCurrency(pos.unrealisedPnl || 0)}</span>
                        <span className="text-xs">{isPositive ? "+" : ""}{formatPercentage(pos.unrealisedPnlPct || 0)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/assets/${pos.ticker}`}>
                            <DropdownMenuItem className="cursor-pointer">View Asset</DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                            onClick={() => deleteMutation.mutate({ id: pos.id })}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Close Position
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

      <AddPositionDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}

function AddPositionDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: searchResults, isLoading: loadingSearch } = useSearchAssets(
    { q: debouncedSearch },
    { query: { enabled: debouncedSearch.length > 1, queryKey: ["/api/assets/search", { q: debouncedSearch }] } }
  );

  const addMutation = useAddPortfolioPosition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio/positions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
        onOpenChange(false);
        resetForm();
      }
    }
  });

  const resetForm = () => {
    setSearch("");
    setSelectedAsset(null);
    setQuantity("");
    setPrice("");
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    addMutation.mutate({
      data: {
        ticker: selectedAsset.ticker,
        name: selectedAsset.name,
        assetType: selectedAsset.assetType,
        quantity: Number(quantity),
        avgBuyPrice: Number(price),
        purchaseDate: new Date(date).toISOString()
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Position</DialogTitle>
        </DialogHeader>

        {!selectedAsset ? (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Search Asset</Label>
              <Input 
                placeholder="Ticker or name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {debouncedSearch.length > 1 && (
              <div className="border border-border rounded-md max-h-[300px] overflow-y-auto">
                {loadingSearch ? (
                  <div className="p-4"><Skeleton className="h-8 w-full" /></div>
                ) : searchResults?.length ? (
                  searchResults.map(asset => (
                    <div 
                      key={asset.ticker}
                      className="p-3 hover:bg-secondary cursor-pointer border-b border-border last:border-0"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="font-bold">{asset.ticker}</div>
                      <div className="text-xs text-muted-foreground">{asset.name}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No results</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
              <div>
                <div className="font-bold">{selectedAsset.ticker}</div>
                <div className="text-xs text-muted-foreground">{selectedAsset.name}</div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedAsset(null)}>Change</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" step="any" min="0" required value={quantity} onChange={e => setQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Avg Buy Price</Label>
                <Input id="price" type="number" step="any" min="0" required value={price} onChange={e => setPrice(e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Purchase Date</Label>
              <Input id="date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={addMutation.isPending}>Add Position</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
