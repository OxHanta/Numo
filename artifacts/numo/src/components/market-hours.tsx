import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Market {
  label: string;
  shortLabel: string;
  isOpen: () => boolean;
  nextEvent: () => { label: string; time: string } | null;
}

function getInTZ(tz: string): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

function minutesOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

const MARKETS: Market[] = [
  {
    label: "NYSE",
    shortLabel: "NYSE",
    isOpen() {
      const d = getInTZ("America/New_York");
      if (!isWeekday(d)) return false;
      const m = minutesOf(d);
      return m >= 9 * 60 + 30 && m < 16 * 60;
    },
    nextEvent() {
      const d = getInTZ("America/New_York");
      if (!isWeekday(d)) return { label: "Opens Mon", time: "9:30 AM ET" };
      const m = minutesOf(d);
      if (m < 9 * 60 + 30) {
        const open = new Date(d);
        open.setHours(9, 30, 0, 0);
        return { label: "Opens", time: fmtTime(open) + " ET" };
      }
      if (m < 16 * 60) {
        const close = new Date(d);
        close.setHours(16, 0, 0, 0);
        return { label: "Closes", time: fmtTime(close) + " ET" };
      }
      return { label: "Opens Mon", time: "9:30 AM ET" };
    },
  },
  {
    label: "NGX",
    shortLabel: "NGX",
    isOpen() {
      const d = getInTZ("Africa/Lagos");
      if (!isWeekday(d)) return false;
      const m = minutesOf(d);
      return m >= 10 * 60 && m < 14 * 60 + 30;
    },
    nextEvent() {
      const d = getInTZ("Africa/Lagos");
      if (!isWeekday(d)) return { label: "Opens Mon", time: "10:00 AM WAT" };
      const m = minutesOf(d);
      if (m < 10 * 60) {
        const open = new Date(d);
        open.setHours(10, 0, 0, 0);
        return { label: "Opens", time: fmtTime(open) + " WAT" };
      }
      if (m < 14 * 60 + 30) {
        const close = new Date(d);
        close.setHours(14, 30, 0, 0);
        return { label: "Closes", time: fmtTime(close) + " WAT" };
      }
      return { label: "Opens Mon", time: "10:00 AM WAT" };
    },
  },
  {
    label: "Crypto",
    shortLabel: "24/7",
    isOpen() { return true; },
    nextEvent() { return null; },
  },
];

export function MarketHoursIndicator() {
  const [, tick] = useState(0);
  const [tooltip, setTooltip] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="px-4 py-3 border-t border-border/60">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-2">
        Market Hours
      </p>
      <div className="flex flex-col gap-1.5">
        {MARKETS.map((market) => {
          const open = market.isOpen();
          const evt = market.nextEvent();
          const tipKey = market.shortLabel;
          return (
            <div
              key={market.label}
              className="flex items-center justify-between group cursor-default relative"
              onMouseEnter={() => setTooltip(tipKey)}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                    open
                      ? "bg-emerald-400 shadow-[0_0_4px_1px_rgba(52,211,153,0.6)] animate-pulse"
                      : "bg-red-400/70"
                  )}
                />
                <span className="text-xs font-semibold text-foreground/80">
                  {market.label}
                </span>
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold px-1.5 py-0.5 rounded",
                  open
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400/80"
                )}
              >
                {open ? "Open" : "Closed"}
              </span>

              {/* Tooltip */}
              {tooltip === tipKey && evt && (
                <div className="absolute left-0 bottom-full mb-1.5 z-50 pointer-events-none">
                  <div
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
                    style={{
                      background: "rgba(20,30,18,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    {evt.label} {evt.time}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
