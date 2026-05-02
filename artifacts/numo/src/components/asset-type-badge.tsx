import { cn } from "@/lib/utils";

type AssetType = "crypto" | "stock" | "etf" | string;

const CONFIG: Record<string, { label: string; className: string }> = {
  crypto: {
    label: "Crypto",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  },
  stock: {
    label: "Stock",
    className: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
  },
  etf: {
    label: "ETF",
    className: "bg-violet-500/15 text-violet-400 border border-violet-500/25",
  },
};

const FALLBACK = {
  label: "Asset",
  className: "bg-secondary text-muted-foreground border border-border",
};

interface AssetTypeBadgeProps {
  type: AssetType;
  className?: string;
  size?: "xs" | "sm";
}

export function AssetTypeBadge({ type, className, size = "xs" }: AssetTypeBadgeProps) {
  const config = CONFIG[type?.toLowerCase()] ?? FALLBACK;
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold uppercase tracking-wider rounded",
        size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
