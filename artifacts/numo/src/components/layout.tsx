import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, List, Briefcase, Bell, Newspaper, LogOut, ChevronRight } from "lucide-react";
import { useClerk, useUser } from "@clerk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { ngxMode, setNgxMode } = useCurrency();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portfolio", label: "Portfolio", icon: Briefcase },
    { href: "/watchlist", label: "Watchlist", icon: List },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/news", label: "News", icon: Newspaper },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card/60 backdrop-blur">
        {/* Logo */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-border/60">
          <img src="/numo-logo-icon.png" alt="Numo icon" className="w-9 h-9 rounded-xl object-contain shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-lg tracking-tight lowercase text-foreground">numo</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Market Intelligence</span>
          </div>
          <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-success opacity-80">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 py-1 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* NGX Currency Toggle */}
        <div className="px-4 py-3 border-t border-border/60">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-2">
            NGX Prices
          </p>
          <div className="flex rounded-lg bg-secondary/50 p-0.5 gap-0.5">
            <button
              onClick={() => setNgxMode("ngn")}
              className={cn(
                "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                ngxMode === "ngn"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              ₦ NGN
            </button>
            <button
              onClick={() => setNgxMode("usd")}
              className={cn(
                "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                ngxMode === "usd"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              $ USD
            </button>
          </div>
        </div>

        {/* User */}
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary transition-colors group">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="text-xs font-bold">{user?.firstName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold leading-none truncate">{user?.fullName || "User"}</span>
              <span className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={() => signOut()}
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur flex justify-around items-center h-16 px-2 z-50">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center w-14 h-full gap-1 cursor-pointer transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
