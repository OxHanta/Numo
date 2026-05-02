import { useState } from "react";
import { useGetPortfolioPositions, useGetPortfolioSummary, useAddPortfolioPosition, useDeletePortfolioPosition, useSearchAssets } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, TrendingUp, TrendingDown, Plus, MoreHorizontal, Trash2, Wallet, BarChart2, DollarSign } from "lucide-react";
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

  const dayPos = (summary?.dayChange || 0) >= 0;
  const pnlPos = (summary?.totalPnl || 0) >= 0;

  const statCards = [
    {
      label: "Total Value",
      icon: Wallet,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      gradient: "from-primary/5",
      value: loadingSummary ? null : formatCurrency(summary?.totalValue || 0),
      sub: null,
      textColor: "",
    },
    {
      label: "Total Cost",
      icon: DollarSign,
      iconColor: "text-muted-foreground",
      iconBg: "bg-secondary",
      gradient: "from-secondary/50",
      value: loadingSummary ? null : formatCurrency(summary?.totalCost || 0),
      sub: null,
      textColor: "",
    },
    {
      label: "Day Change",
      icon: dayPos ? TrendingUp : TrendingDown,
      iconColor: dayPos ? "text-success" : "text-destructive",
      iconBg: dayPos ? "bg-success/10" : "bg-destructive/10",
      gradient: dayPos ? "from-success/5" : "from-destructive/5",
      value: loadingSummary ? null : `${dayPos ? "+" : ""}${formatCurrency(summary?.dayChange || 0)}`,
      sub: null,
      textColor: dayPos ? "text-success" : "text-destructive",
    },
    {
      label: "Total Return",
      icon: BarChart2,
      iconColor: pnlPos ? "text-success" : "text-destructive",
      iconBg: pnlPos ? "bg-success/10" : "bg-destructive/10",
      gradient: pnlPos ? "from-success/5" : "from-destructive/5",
      value: loadingSummary ? null : `${pnlPos ? "+" : ""}${formatCurrency(summary?.totalPnl || 0)}`,
      sub: loadingSummary ? null : formatPercentage(summary?.totalPnlPct || 0),
      textColor: pnlPos ? "text-success" : "text-destructive",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">Overview</p>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Position
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className={cn(
            "p-5 rounded-xl bg-card border border-border relative overflow-hidden"
          )}>
            <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none", card.gradient)} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</span>
              <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", card.iconBg)}>
                <card.icon className={cn("w-3.5 h-3.5", card.iconColor)} />
              </div>
            </div>
            {card.value === null ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className={cn("text-2xl font-bold tracking-tight flex items-baseline gap-1.5", card.textColor)}>
                {card.value}
                {card.sub && <span className="text-sm font-semibold opacity-70">{card.sub}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Positions Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-base">Positions</h2>
          <span className="text-xs text-muted-foreground">
            {positions?.length ?? 0} {positions?.length === 1 ? "holding" : "holdings"}
          </span>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/40 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3">Asset</th>
              <th className="px-6 py-3 text-right">Holdings</th>
              <th className="px-6 py-3 text-right">Avg Cost</th>
              <th className="px-6 py-3 text-right">Current Price</th>
              <th className="px-6 py-3 text-right">Value</th>
              <th className="px-6 py-3 text-right">Unrealised P&L</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loadingPositions ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-9 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-16 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-20 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-20 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-24 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-20 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-7 w-7 ml-auto" /></td>
                </tr>
              ))
            ) : positions?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Portfolio is empty</p>
                      <p className="text-xs mt-1">Add your first position to start tracking.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Position
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              positions?.map((pos, i) => {
                const isPositive = (pos.unrealisedPnlPct || 0) >= 0;
                return (
                  <motion.tr
                    key={pos.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-secondary/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/assets/${pos.ticker}`} className="block">
                        <div className="font-bold text-sm group-hover:text-primary transition-colors">{pos.ticker}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{pos.name}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right font-medium tabular-nums">{pos.quantity}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground tabular-nums">{formatCurrency(pos.avgBuyPrice)}</td>
                    <td className="px-6 py-4 text-right font-medium tabular-nums">{formatCurrency(pos.currentPrice || 0)}</td>
                    <td className="px-6 py-4 text-right font-bold tabular-nums">{formatCurrency(pos.currentValue || 0)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className={cn("flex flex-col items-end", isPositive ? "text-success" : "text-destructive")}>
                        <span className="font-bold tabular-nums text-sm">
                          {isPositive ? "+" : ""}{formatCurrency(pos.unrealisedPnl || 0)}
                        </span>
                        <span className="text-[11px] tabular-nums">
                          {isPositive ? "+" : ""}{formatPercentage(pos.unrealisedPnlPct || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7">
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

function AddPositionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

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
    setDate(new Date().toISOString().split("T")[0]);
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
        purchaseDate: new Date(date).toISOString(),
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Add Position</DialogTitle>
        </DialogHeader>

        {!selectedAsset ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search Asset</Label>
              <Input
                placeholder="Ticker or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <AnimatePresence>
              {debouncedSearch.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="border border-border rounded-lg max-h-[260px] overflow-y-auto bg-card"
                >
                  {loadingSearch ? (
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : searchResults?.length ? (
                    searchResults.map((asset) => (
                      <div
                        key={asset.ticker}
                        className="px-4 py-3 hover:bg-secondary cursor-pointer border-b border-border/60 last:border-0 flex items-center justify-between group"
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <div>
                          <div className="font-bold text-sm flex items-center gap-2">
                            {asset.ticker}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase font-medium">
                              {asset.assetType}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{asset.name}</div>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground">No results found</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 bg-secondary/60 rounded-lg border border-border/60">
              <div>
                <div className="font-bold text-sm">{selectedAsset.ticker}</div>
                <div className="text-xs text-muted-foreground">{selectedAsset.name}</div>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedAsset(null)}>
                Change
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</Label>
                <Input id="quantity" type="number" step="any" min="0" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Buy Price</Label>
                <Input id="price" type="number" step="any" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purchase Date</Label>
              <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Adding..." : "Add Position"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
