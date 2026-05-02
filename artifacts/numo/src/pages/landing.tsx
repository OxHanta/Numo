import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Activity, TrendingUp, Shield, Zap, ArrowRight, BarChart2, Bell } from "lucide-react";
import { motion } from "framer-motion";

const STATS = [
  { value: "Real-time", label: "Market Data" },
  { value: "Multi-asset", label: "Stocks, Crypto, ETFs" },
  { value: "Precision", label: "Price Alerts" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 lg:px-8 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0">
        <div className="flex items-center gap-2.5">
          <img src="/numo-logo-icon.png" alt="Numo" className="w-9 h-9 rounded-xl object-contain" />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-base tracking-tight lowercase text-foreground">numo</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Market Intelligence</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-medium text-sm">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-medium text-sm bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative py-24 px-6 lg:px-8 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_40%_30%_at_70%_60%,_var(--tw-gradient-stops))] from-warning/5 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.08]">
              Your Personal{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-warning to-primary">
                Finance Cockpit
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Track portfolios, monitor watchlists, and get real-time alerts in a tight, dense, no-nonsense interface. Think terminal, but built for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8 font-semibold shadow-lg shadow-primary/20">
                  Open Numo Free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-8 font-semibold">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats bar */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-0 justify-center items-center sm:divide-x sm:divide-border">
              {STATS.map((stat) => (
                <div key={stat.label} className="sm:px-10 text-center">
                  <div className="text-lg font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 lg:px-8 border-y border-border bg-secondary/20">
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

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* CTA */}
        <section className="py-20 px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Ready to take control?</h2>
            <p className="text-muted-foreground mb-8">Join investors who track smarter with Numo. Free to start, no credit card required.</p>
            <Link href="/sign-up">
              <Button size="lg" className="text-base h-12 px-10 font-semibold shadow-lg shadow-primary/20">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="py-8 px-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-muted-foreground text-xs">
        <div className="flex items-center gap-2">
          <img src="/numo-logo-icon.png" alt="Numo" className="w-6 h-6 rounded-lg object-contain" />
          <span className="font-extrabold lowercase text-foreground tracking-tight">numo</span>
        </div>
        <p>© {new Date().getFullYear()} Numo Market Intelligence. Built for active traders.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, color, bg, title, description }: {
  icon: any;
  color: string;
  bg: string;
  title: string;
  description: string;
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

import { cn } from "@/lib/utils";
