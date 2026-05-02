import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Activity, TrendingUp, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">N</div>
          <span className="text-xl font-bold tracking-tight">Numo</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-medium">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-medium bg-primary text-primary-foreground">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative py-24 px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-primary"></span>
              Precision market intelligence for retail investors
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Finance Cockpit</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Track portfolios, monitor watchlists, and get real-time alerts in a tight, dense, no-nonsense interface. Think terminal, but built for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 font-medium">
                  Open Numo Free
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 font-medium">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 lg:px-8 bg-secondary/30 border-y border-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              <FeatureCard 
                icon={Activity}
                title="Dense Data, Zero Noise"
                description="Information-rich interfaces that respect your time. See exactly what you need at a glance without the marketing fluff."
              />
              <FeatureCard 
                icon={TrendingUp}
                title="Real-Time Portfolios"
                description="Track unrealised P&L, day changes, and total returns across stocks, crypto, and ETFs in one unified view."
              />
              <FeatureCard 
                icon={Zap}
                title="Actionable Alerts"
                description="Set precise price and percentage alerts. Get notified instantly when the market moves so you never miss an opportunity."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-8 border-t border-border text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} Numo Market Intelligence. Built for active traders.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4"
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}
