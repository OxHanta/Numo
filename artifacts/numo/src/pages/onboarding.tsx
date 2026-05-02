import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { AssetTypeBadge } from "@/components/asset-type-badge";
import { useAddToWatchlist } from "@workspace/api-client-react";

const MARKETS = [
  {
    id: "us_stocks",
    label: "US Stocks",
    description: "AAPL, TSLA, NVDA & more",
    icon: "🇺🇸",
    assetType: "stock" as const,
  },
  {
    id: "ngx",
    label: "Nigerian Stocks",
    description: "NGX-listed companies",
    icon: "🇳🇬",
    assetType: "ngx" as const,
  },
  {
    id: "crypto",
    label: "Crypto",
    description: "BTC, ETH, SOL & more",
    icon: "₿",
    assetType: "crypto" as const,
  },
  {
    id: "etf",
    label: "ETFs",
    description: "SPY, QQQ, VTI & more",
    icon: "📊",
    assetType: "etf" as const,
  },
];

type AssetItem = {
  ticker: string;
  name: string;
  assetType: "stock" | "crypto" | "etf" | "ngx";
  flag?: string;
};

const POPULAR: Record<string, AssetItem[]> = {
  us_stocks: [
    { ticker: "AAPL", name: "Apple Inc.", assetType: "stock" },
    { ticker: "MSFT", name: "Microsoft", assetType: "stock" },
    { ticker: "NVDA", name: "NVIDIA", assetType: "stock" },
    { ticker: "GOOGL", name: "Alphabet", assetType: "stock" },
    { ticker: "AMZN", name: "Amazon", assetType: "stock" },
    { ticker: "TSLA", name: "Tesla", assetType: "stock" },
    { ticker: "META", name: "Meta Platforms", assetType: "stock" },
    { ticker: "NFLX", name: "Netflix", assetType: "stock" },
  ],
  ngx: [
    { ticker: "DANGCEM.LG", name: "Dangote Cement", assetType: "ngx" },
    { ticker: "GTCO.LG", name: "GT Holding Co.", assetType: "ngx" },
    { ticker: "ZENITHBANK.LG", name: "Zenith Bank", assetType: "ngx" },
    { ticker: "MTNN.LG", name: "MTN Nigeria", assetType: "ngx" },
    { ticker: "AIRTELAFRI.LG", name: "Airtel Africa", assetType: "ngx" },
    { ticker: "ACCESS.LG", name: "Access Holdings", assetType: "ngx" },
    { ticker: "UBA.LG", name: "United Bank for Africa", assetType: "ngx" },
    { ticker: "SEPLAT.LG", name: "Seplat Energy", assetType: "ngx" },
  ],
  crypto: [
    { ticker: "BTC", name: "Bitcoin", assetType: "crypto" },
    { ticker: "ETH", name: "Ethereum", assetType: "crypto" },
    { ticker: "SOL", name: "Solana", assetType: "crypto" },
    { ticker: "BNB", name: "BNB", assetType: "crypto" },
    { ticker: "XRP", name: "XRP", assetType: "crypto" },
    { ticker: "ADA", name: "Cardano", assetType: "crypto" },
    { ticker: "AVAX", name: "Avalanche", assetType: "crypto" },
    { ticker: "DOGE", name: "Dogecoin", assetType: "crypto" },
  ],
  etf: [
    { ticker: "SPY", name: "SPDR S&P 500 ETF", assetType: "etf" },
    { ticker: "QQQ", name: "Invesco QQQ Trust", assetType: "etf" },
    { ticker: "VTI", name: "Vanguard Total Market", assetType: "etf" },
    { ticker: "GLD", name: "SPDR Gold ETF", assetType: "etf" },
    { ticker: "IVV", name: "iShares Core S&P 500", assetType: "etf" },
    { ticker: "VEA", name: "Vanguard FTSE Dev Mkts", assetType: "etf" },
  ],
};

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const addToWatchlist = useAddToWatchlist();

  const availableAssets: AssetItem[] = Array.from(selectedMarkets).flatMap(
    (m) => POPULAR[m] ?? []
  );

  function toggleMarket(id: string) {
    setSelectedMarkets((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAsset(ticker: string) {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      next.has(ticker) ? next.delete(ticker) : next.add(ticker);
      return next;
    });
  }

  async function finishOnboarding() {
    setAdding(true);
    const toAdd = availableAssets.filter((a) => selectedAssets.has(a.ticker));
    await Promise.allSettled(
      toAdd.map((a) =>
        addToWatchlist.mutateAsync({
          data: { ticker: a.ticker, name: a.name, assetType: a.assetType },
        })
      )
    );
    localStorage.setItem("numo_onboarding_done", "1");
    setLocation("/dashboard");
  }

  function skipOnboarding() {
    localStorage.setItem("numo_onboarding_done", "1");
    setLocation("/dashboard");
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: "#0b1509" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(76,175,80,0.15) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 rounded-full transition-all",
                s === step ? "w-8 bg-[#4CAF50]" : s < step ? "w-4 bg-[#4CAF50]/60" : "w-4 bg-white/10"
              )}
            />
          ))}
        </div>

        <div className="w-full max-w-[520px]">
          {/* STEP 1 — Welcome */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center">
              <img
                src="/numo-logo-icon.png"
                alt="Numo"
                className="w-20 h-20 rounded-3xl shadow-2xl shadow-green-900/40 mb-6"
              />
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                Welcome to Numo
              </h1>
              <p className="text-white/50 text-base mb-2 max-w-sm leading-relaxed">
                Your personal finance cockpit is ready. Let's set up your watchlist in under a minute.
              </p>
              <p className="text-white/30 text-sm mb-10">
                Takes about 30 seconds
              </p>
              <button
                onClick={() => setStep(2)}
                className="w-full max-w-xs h-12 rounded-xl font-semibold text-white text-base transition-all"
                style={{ background: "#4CAF50" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#43A047")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#4CAF50")}
              >
                Get Started →
              </button>
              <button
                onClick={skipOnboarding}
                className="mt-3 text-sm text-white/30 hover:text-white/50 transition-colors"
              >
                Skip setup
              </button>
            </div>
          )}

          {/* STEP 2 — Market interests */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1">
                What do you want to track?
              </h2>
              <p className="text-white/40 text-sm mb-6">Pick one or more markets.</p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {MARKETS.map((m) => {
                  const selected = selectedMarkets.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMarket(m.id)}
                      className={cn(
                        "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                        selected
                          ? "border-[#4CAF50] bg-[#4CAF50]/10"
                          : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5"
                      )}
                    >
                      <span className="text-2xl mb-2">{m.icon}</span>
                      <span className="font-semibold text-white text-sm">{m.label}</span>
                      <span className="text-white/40 text-xs mt-0.5">{m.description}</span>
                      {selected && (
                        <span className="mt-2 text-[10px] font-bold text-[#4CAF50] uppercase tracking-wider">
                          ✓ Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setStep(3)}
                disabled={selectedMarkets.size === 0}
                className="w-full h-12 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#4CAF50" }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = "#43A047")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#4CAF50")}
              >
                Continue →
              </button>
              <button
                onClick={skipOnboarding}
                className="mt-3 w-full text-sm text-white/30 hover:text-white/50 transition-colors"
              >
                Skip setup
              </button>
            </div>
          )}

          {/* STEP 3 — Pick assets */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-1">
                Pick assets to follow
              </h2>
              <p className="text-white/40 text-sm mb-6">
                These will be added to your watchlist. You can always change them later.
              </p>
              <div className="space-y-6 mb-8 max-h-[380px] overflow-y-auto pr-1">
                {Array.from(selectedMarkets).map((marketId) => {
                  const market = MARKETS.find((m) => m.id === marketId)!;
                  const assets = POPULAR[marketId] ?? [];
                  return (
                    <div key={marketId}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">{market.icon}</span>
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
                          {market.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {assets.map((a) => {
                          const sel = selectedAssets.has(a.ticker);
                          return (
                            <button
                              key={a.ticker}
                              onClick={() => toggleAsset(a.ticker)}
                              className={cn(
                                "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                                sel
                                  ? "border-[#4CAF50] bg-[#4CAF50]/10"
                                  : "border-white/8 bg-white/3 hover:border-white/15"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-bold text-xs truncate">
                                  {a.ticker.replace(/\.LG$/i, "")}
                                </div>
                                <div className="text-white/40 text-[11px] truncate mt-0.5">
                                  {a.name}
                                </div>
                              </div>
                              <AssetTypeBadge type={a.assetType} size="xs" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={finishOnboarding}
                disabled={adding}
                className="w-full h-12 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-70"
                style={{ background: "#4CAF50" }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = "#43A047")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#4CAF50")}
              >
                {adding
                  ? "Setting up..."
                  : selectedAssets.size > 0
                  ? `Add ${selectedAssets.size} asset${selectedAssets.size !== 1 ? "s" : ""} & Go to Dashboard →`
                  : "Go to Dashboard →"}
              </button>
              <button
                onClick={skipOnboarding}
                className="mt-3 w-full text-sm text-white/30 hover:text-white/50 transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="relative z-10 pb-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
        © {new Date().getFullYear()} Numo Market Intelligence
      </footer>
    </div>
  );
}
