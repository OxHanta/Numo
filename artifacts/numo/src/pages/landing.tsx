import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Shield, Zap, ArrowRight, BarChart2, Bell, Bitcoin, Building2, Sparkles, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthModal } from "@/context/auth-modal";
import { BarChart, Bar, ResponsiveContainer, Cell, ComposedChart, Line } from "recharts";

const NAV_LINKS = ["Features", "Pricing", "Markets", "About"];

const STATS = [
  { value: "NGX + NYSE", label: "Dual Market Coverage" },
  { value: "Live", label: "Real-Time Quotes" },
  { value: "Multi-asset", label: "Stocks, Crypto, ETFs" },
];

// ─── Static mock data for the hero preview ──────────────────────────────────

const MOCK_SECTORS = [
  { key: "TECH", pct: 2.4,  positive: true },
  { key: "FIN",  pct: 0.8,  positive: true },
  { key: "HLTH", pct: -0.6, positive: false },
  { key: "ENER", pct: -2.1, positive: false },
];

const MOCK_MCAP_BARS = [
  { value: 2.38 }, { value: 2.41 }, { value: 2.35 }, { value: 2.44 },
  { value: 2.51 }, { value: 2.48 }, { value: 2.56 },
];

const MOCK_PORTFOLIO_BARS = [
  { v: 9200 }, { v: 10100 }, { v: 9700 }, { v: 11000 },
  { v: 11800 }, { v: 13400 }, { v: 16073 },
];

const MOCK_GAINERS = [
  { ticker: "BTC",  name: "Bitcoin",     pct: "+8.3%",  price: "$102,440" },
  { ticker: "NVDA", name: "Nvidia Corp", pct: "+4.1%",  price: "$924.60" },
  { ticker: "GTCO", name: "GT Bank",     pct: "+3.8%",  price: "₦68.50"  },
];

// ─── Preview sub-components (static, no auth) ────────────────────────────────

function PreviewCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-2xl border border-white/10 bg-card/90 backdrop-blur-md shadow-2xl shadow-black/60 p-4",
      className
    )}>
      {children}
    </div>
  );
}

function PortfolioPreviewCard() {
  return (
    <PreviewCard>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Portfolio Value</div>
      <div className="text-2xl font-extrabold tabular-nums text-foreground mb-0.5">$16,073.49</div>
      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-3">
        <TrendingUp className="w-3.5 h-3.5" /> +$1,240.30 today (+8.3%)
      </div>
      <ResponsiveContainer width="100%" height={52}>
        <ComposedChart data={MOCK_PORTFOLIO_BARS} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Bar dataKey="v" radius={[3, 3, 0, 0]} barSize={10}>
            {MOCK_PORTFOLIO_BARS.map((_, i) => (
              <Cell key={i} fill={i === MOCK_PORTFOLIO_BARS.length - 1 ? "#4CAF50" : "rgba(76,175,80,0.2)"} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="v" stroke="#4CAF50" strokeWidth={1.5} dot={false} strokeOpacity={0.7} />
        </ComposedChart>
      </ResponsiveContainer>
    </PreviewCard>
  );
}

function DayChangePreviewCard() {
  return (
    <PreviewCard>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Day Change</div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-emerald-400 tabular-nums">+$1,240.30</span>
        <span className="text-xs font-semibold text-emerald-400/70">+8.3%</span>
      </div>
      <div className="mt-2 flex gap-1">
        {[40, 55, 35, 70, 80, 65, 90].map((h, i) => (
          <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 0.3}px`, background: i > 4 ? "#4CAF50" : "rgba(76,175,80,0.25)", alignSelf: "flex-end" }} />
        ))}
      </div>
    </PreviewCard>
  );
}

function SectorHeatmapPreview() {
  return (
    <PreviewCard className="w-full">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Sector Heatmap</div>
      <div className="grid grid-cols-2 gap-2">
        {MOCK_SECTORS.map(s => (
          <div key={s.key} className={cn(
            "rounded-xl border px-3 py-3 flex flex-col gap-1",
            s.positive ? "bg-emerald-900/50 border-emerald-700/50" : "bg-rose-900/50 border-rose-700/50"
          )}>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", s.positive ? "text-emerald-400/70" : "text-rose-400/70")}>{s.key}</span>
            <span className={cn("text-lg font-bold tabular-nums leading-none", s.positive ? "text-emerald-300" : "text-rose-300")}>
              {s.pct > 0 ? "+" : ""}{s.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </PreviewCard>
  );
}

function MarketCapPreview() {
  return (
    <PreviewCard>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Crypto Market Cap</div>
      <div className="text-xl font-bold text-primary tabular-nums mb-0.5">$2.56T</div>
      <div className="text-[11px] font-semibold text-emerald-400 mb-2">+3.24% today</div>
      <ResponsiveContainer width="100%" height={48}>
        <BarChart data={MOCK_MCAP_BARS} barSize={10} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {MOCK_MCAP_BARS.map((_, i) => (
              <Cell key={i} fill={i === MOCK_MCAP_BARS.length - 1 ? "#4CAF50" : "rgba(76,175,80,0.22)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </PreviewCard>
  );
}

function TopPerformersPreview() {
  return (
    <PreviewCard className="w-full">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Top Performers</div>
      <div className="divide-y divide-white/5">
        {MOCK_GAINERS.map(g => (
          <div key={g.ticker} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {g.ticker === "BTC" ? <Bitcoin className="w-3.5 h-3.5" /> : g.ticker[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground leading-tight">{g.ticker}</div>
              <div className="text-[10px] text-muted-foreground truncate">{g.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-foreground tabular-nums">{g.price}</div>
              <div className="text-[10px] font-semibold text-emerald-400">{g.pct}</div>
            </div>
          </div>
        ))}
      </div>
    </PreviewCard>
  );
}

function TrendingInsightPreview() {
  return (
    <PreviewCard className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,rgba(76,175,80,0.14) 0%,rgba(76,175,80,0.05) 100%)", borderColor: "rgba(76,175,80,0.25)" }}
    >
      <div className="absolute top-2 right-3 opacity-[0.07]">
        <TrendingUp className="w-16 h-16 text-primary" strokeWidth={1.5} />
      </div>
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center mb-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="text-xs font-bold text-foreground mb-1">Sector Rotation</div>
      <div className="text-[10px] text-muted-foreground leading-relaxed">
        Tech and Financials are leading today's market. Energy under pressure.
      </div>
    </PreviewCard>
  );
}

// ─── Main landing page ────────────────────────────────────────────────────────

export default function Landing() {
  const { open } = useAuthModal();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      {/* ── Header ── */}
      <header className="py-4 px-6 lg:px-12 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0">
        <div className="flex items-center gap-2.5">
          <img src="/numo-logo-icon.png" alt="Numo" className="w-9 h-9 rounded-xl object-contain" />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-base tracking-tight lowercase text-foreground">numo</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Market Intelligence</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <button key={link} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="font-medium text-sm hidden sm:inline-flex" onClick={() => open("sign-in")}>
            Sign In
          </Button>
          <Button
            className="font-semibold text-sm bg-primary text-primary-foreground shadow-sm shadow-primary/25 rounded-full px-5"
            onClick={() => open("sign-up")}
          >
            Get Started
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* ── Hero ── */}
        <section className="relative pt-24 pb-0 px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden">
          {/* Gradient bg */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,_var(--tw-gradient-stops))] from-primary/18 via-background to-background" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_40%_at_70%_70%,_var(--tw-gradient-stops))] from-warning/6 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-xs font-semibold text-primary mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live market data — NGX + NYSE + Crypto
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6">
              Track Smarter.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary">
                Invest Smarter.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Your personal finance cockpit for stocks, crypto, and ETFs — real-time portfolios, sector insights, and price alerts in one tight interface.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base h-12 px-8 font-semibold rounded-full shadow-lg shadow-primary/25"
                onClick={() => open("sign-up")}
              >
                Open Numo Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base h-12 px-8 font-semibold rounded-full"
                onClick={() => open("sign-in")}
              >
                Sign In
              </Button>
            </div>

            {/* Stats bar */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-0 justify-center items-center sm:divide-x sm:divide-border mb-16">
              {STATS.map(stat => (
                <div key={stat.label} className="sm:px-8 text-center">
                  <div className="text-sm font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Product Preview Cards (Orbix-style) ── */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative w-full max-w-5xl mx-auto"
          >
            {/* Glow stage beneath cards */}
            <div className="absolute inset-x-10 -bottom-10 top-8 -z-10 rounded-3xl blur-3xl bg-gradient-to-b from-primary/20 via-primary/8 to-transparent" />

            {/* Cards grid: left | center | right */}
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_220px] gap-3 items-start">
              {/* Left column */}
              <div className="flex flex-col gap-3">
                <PortfolioPreviewCard />
                <DayChangePreviewCard />
              </div>

              {/* Center — Sector Heatmap (main panel) */}
              <div className="flex flex-col gap-3">
                <SectorHeatmapPreview />
                <TopPerformersPreview />
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-3">
                <MarketCapPreview />
                <TrendingInsightPreview />
              </div>
            </div>

            {/* Fade-out gradient at bottom so it flows into next section */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-background pointer-events-none" />
          </motion.div>
        </section>

        {/* ── Features ── */}
        <section className="pt-24 pb-20 px-6 lg:px-8 border-y border-border bg-secondary/20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl font-extrabold tracking-tight mb-3">Everything you need. Nothing you don't.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">A financial dashboard built around clarity — fast data, zero fluff.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              <FeatureCard
                icon={Activity}
                color="text-warning"
                bg="bg-warning/10"
                title="Dense Data, Zero Noise"
                description="Information-rich interfaces that respect your time. See exactly what you need at a glance."
              />
              <FeatureCard
                icon={BarChart2}
                color="text-primary"
                bg="bg-primary/10"
                title="Real-Time Portfolios"
                description="Track unrealised P&L, day changes, and total returns across stocks, crypto, and ETFs."
              />
              <FeatureCard
                icon={Bell}
                color="text-yellow-400"
                bg="bg-yellow-400/10"
                title="Actionable Alerts"
                description="Set precise price and percentage alerts. Get notified instantly when the market moves."
              />
              <FeatureCard
                icon={Shield}
                color="text-primary"
                bg="bg-primary/10"
                title="Secure & Private"
                description="Your data stays yours. Backed by enterprise-grade auth — no ads, no data selling."
              />
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-xs font-semibold text-primary mb-6">
              <Zap className="w-3.5 h-3.5" /> Free to start — no credit card required
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">Ready to take control<br />of your portfolio?</h2>
            <p className="text-muted-foreground mb-10 text-lg">Join investors who track smarter with Numo.</p>
            <Button
              size="lg"
              className="text-base h-13 px-12 font-semibold shadow-lg shadow-primary/25 rounded-full"
              onClick={() => open("sign-up")}
            >
              Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-8 px-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-muted-foreground text-xs">
        <div className="flex items-center gap-2">
          <img src="/numo-logo-icon.png" alt="Numo" className="w-6 h-6 rounded-lg object-contain" />
          <span className="font-extrabold lowercase text-foreground tracking-tight">numo</span>
        </div>
        <p>© {new Date().getFullYear()} Numo Market Intelligence. Built for active traders.</p>
        <div className="flex gap-5">
          {["Privacy", "Terms", "Contact"].map(l => (
            <button key={l} className="hover:text-foreground transition-colors">{l}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, color, bg, title, description }: {
  icon: any; color: string; bg: string; title: string; description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 p-6 rounded-xl border border-border bg-card hover:bg-secondary/40 transition-colors"
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bg)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div>
        <h3 className="text-base font-bold mb-1.5">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
