import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

type CurrencyMode = "ngn" | "usd";

interface CurrencyContextValue {
  ngxMode: CurrencyMode;
  setNgxMode: (mode: CurrencyMode) => void;
  usdNgnRate: number;
  formatPrice: (value: number, assetType: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
const STORAGE_KEY = "numo_ngx_currency";
const DEFAULT_RATE = 1600;

function fmtUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function fmtNGN(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [ngxMode, setNgxModeState] = useState<CurrencyMode>(
    () => (localStorage.getItem(STORAGE_KEY) as CurrencyMode) || "ngn"
  );
  const [usdNgnRate, setUsdNgnRate] = useState(DEFAULT_RATE);

  useEffect(() => {
    fetch(`${BASE_PATH}/api/market/rate/ngn`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.rate && typeof data.rate === "number") setUsdNgnRate(data.rate);
      })
      .catch(() => {});
  }, []);

  const setNgxMode = useCallback((mode: CurrencyMode) => {
    setNgxModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const formatPrice = useCallback(
    (value: number, assetType: string): string => {
      if (assetType === "ngx") {
        return ngxMode === "ngn" ? fmtNGN(value) : fmtUSD(value / usdNgnRate);
      }
      return fmtUSD(value);
    },
    [ngxMode, usdNgnRate]
  );

  return (
    <CurrencyContext.Provider value={{ ngxMode, setNgxMode, usdNgnRate, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
