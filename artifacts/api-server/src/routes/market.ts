import { Router } from "express";
import { requireAuth } from "./auth";
import { GetChartDataParams, GetChartDataQueryParams, GetQuoteParams, SearchAssetsQueryParams } from "@workspace/api-zod";
import yahooFinance from "yahoo-finance2";

const router = Router();
const POLYGON_KEY = process.env.POLYGON_API_KEY;
const DEFAULT_NGN_RATE = 1600;

function isNGXTicker(ticker: string): boolean {
  return /\.(LG|LA|NGX)$/i.test(ticker);
}

function timeframeToPolygon(tf: string): { multiplier: number; timespan: string; daysBack: number } {
  switch (tf) {
    case "1D": return { multiplier: 5, timespan: "minute", daysBack: 1 };
    case "5D": return { multiplier: 30, timespan: "minute", daysBack: 5 };
    case "1M": return { multiplier: 1, timespan: "day", daysBack: 30 };
    case "3M": return { multiplier: 1, timespan: "day", daysBack: 90 };
    case "6M": return { multiplier: 1, timespan: "day", daysBack: 180 };
    case "1Y": return { multiplier: 1, timespan: "day", daysBack: 365 };
    case "5Y": return { multiplier: 1, timespan: "week", daysBack: 1825 };
    default:   return { multiplier: 1, timespan: "day", daysBack: 30 };
  }
}

type QuoteResult = {
  ticker: string; price: number; open: number; high: number; low: number;
  previousClose: number; change: number; changePct: number; volume: number | null; updatedAt: string;
};

async function fetchYahooQuote(yahooTicker: string, displayTicker?: string): Promise<QuoteResult | null> {
  try {
    const q = await (yahooFinance.quote as any)(yahooTicker, {}, { validateResult: false });
    if (!q || !q.regularMarketPrice) return null;
    return {
      ticker: (displayTicker || yahooTicker).toUpperCase(),
      price: q.regularMarketPrice ?? 0,
      open: q.regularMarketOpen ?? 0,
      high: q.regularMarketDayHigh ?? 0,
      low: q.regularMarketDayLow ?? 0,
      previousClose: q.regularMarketPreviousClose ?? 0,
      change: q.regularMarketChange ?? 0,
      changePct: q.regularMarketChangePercent ?? 0,
      volume: q.regularMarketVolume ?? null,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchQuote(ticker: string, assetType?: string): Promise<QuoteResult | null> {
  // NGX stocks always use Yahoo Finance
  if (assetType === "ngx" || isNGXTicker(ticker)) {
    return fetchYahooQuote(ticker, ticker);
  }

  // Try Polygon for US stocks, ETFs, and major crypto
  if (POLYGON_KEY) {
    const t = assetType === "crypto" ? `X:${ticker}USD` : ticker.toUpperCase();
    const market = assetType === "crypto" ? "crypto" : "stocks";
    const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/${market}/tickers/${t}?apiKey=${POLYGON_KEY}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json() as any;
      const snap = data?.ticker || data?.tickers?.[0];
      if (snap) {
        const d = snap.day ?? {};
        const pd = snap.prevDay ?? {};
        const price = snap.lastTrade?.p ?? snap.lastQuote?.P ?? d.c ?? 0;
        const prevClose = pd.c ?? 0;
        const change = price - prevClose;
        const changePct = prevClose ? (change / prevClose) * 100 : 0;
        return {
          ticker: ticker.toUpperCase(), price,
          open: d.o ?? price, high: d.h ?? price, low: d.l ?? price,
          previousClose: prevClose, change, changePct,
          volume: d.v ?? null, updatedAt: new Date().toISOString(),
        };
      }
    } catch { /* fall through */ }
  }

  // Fallback: Yahoo Finance for crypto (SOL, ZKC, BTC, etc.)
  if (assetType === "crypto") {
    return fetchYahooQuote(`${ticker}-USD`, ticker);
  }

  // Last resort: try Yahoo directly
  return fetchYahooQuote(ticker, ticker);
}

async function searchPolygon(q: string): Promise<any[]> {
  if (!POLYGON_KEY) return [];
  try {
    const url = `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(q)}&active=true&limit=8&apiKey=${POLYGON_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json() as any;
    return (data?.results ?? []).map((r: any) => ({
      ticker: r.ticker,
      name: r.name,
      assetType: r.market === "crypto" ? "crypto" : r.type === "ETF" ? "etf" : "stock",
      exchange: r.primary_exchange ?? null,
    }));
  } catch {
    return [];
  }
}

async function searchYahoo(q: string): Promise<any[]> {
  try {
    const results = await (yahooFinance.search as any)(q, { newsCount: 0, quotesCount: 8 }, { validateResult: false });
    const quotes: any[] = results?.quotes ?? [];
    return quotes
      .filter((r: any) => r.symbol && r.quoteType)
      .map((r: any) => {
        const isNGX =
          r.exchange === "LG" ||
          (r.fullExchangeName ?? "").toLowerCase().includes("lagos") ||
          (r.exchDisp ?? "").toLowerCase().includes("nigeria") ||
          /\.(LG|LA)$/i.test(r.symbol);
        const isCrypto = r.quoteType === "CRYPTOCURRENCY";
        const isETF = r.quoteType === "ETF";
        const ticker = isCrypto
          ? r.symbol.replace(/-USD$/i, "").replace(/-.*$/, "")
          : r.symbol;
        return {
          ticker,
          name: r.longname || r.shortname || r.symbol,
          assetType: isNGX ? "ngx" : isCrypto ? "crypto" : isETF ? "etf" : "stock",
          exchange: isNGX ? "NGX" : r.exchange ?? null,
        };
      });
  } catch {
    return [];
  }
}

router.get("/market/search", requireAuth, async (req, res) => {
  const parsed = SearchAssetsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const q = parsed.data.q;
  try {
    const [polygonResults, yahooResults] = await Promise.all([searchPolygon(q), searchYahoo(q)]);
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const r of [...polygonResults, ...yahooResults]) {
      const key = r.ticker?.toUpperCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
    }
    res.json(merged.slice(0, 12));
  } catch (err) {
    req.log.error({ err }, "Search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/market/quote/:ticker", requireAuth, async (req, res) => {
  const parsed = GetQuoteParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { ticker } = parsed.data;
  const assetType = req.query.assetType as string | undefined;
  const quote = await fetchQuote(ticker, assetType);
  if (!quote) return res.status(404).json({ error: "Quote not available" });
  res.json(quote);
});

router.get("/market/chart/:ticker", requireAuth, async (req, res) => {
  const paramsParsed = GetChartDataParams.safeParse(req.params);
  const queryParsed = GetChartDataQueryParams.safeParse(req.query);
  if (!paramsParsed.success) return res.status(400).json({ error: paramsParsed.error.issues });
  const { ticker } = paramsParsed.data;
  const timeframe = (queryParsed.success ? queryParsed.data.timeframe : "1M") ?? "1M";
  const assetType = req.query.assetType as string | undefined;
  const { multiplier, timespan, daysBack } = timeframeToPolygon(timeframe);
  const to = new Date();
  const from = new Date(Date.now() - daysBack * 86400000);
  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];

  // NGX stocks — Yahoo Finance historical
  if (assetType === "ngx" || isNGXTicker(ticker)) {
    try {
      const historical = await (yahooFinance.historical as any)(ticker, {
        period1: fromStr, period2: toStr, interval: "1d",
      }, { validateResult: false });
      const candles = (historical || []).map((c: any) => ({
        time: Math.floor(new Date(c.date).getTime() / 1000),
        open: c.open ?? 0, high: c.high ?? 0, low: c.low ?? 0, close: c.close ?? 0, volume: c.volume ?? 0,
      }));
      return res.json({ ticker: ticker.toUpperCase(), timeframe, candles });
    } catch (err) {
      req.log.error({ err }, "Yahoo NGX chart failed");
      return res.status(500).json({ error: "Chart data unavailable" });
    }
  }

  try {
    // Try Polygon first
    if (POLYGON_KEY) {
      const polyTicker = assetType === "crypto" ? `X:${ticker}USD` : ticker.toUpperCase();
      const url = `https://api.polygon.io/v2/aggs/ticker/${polyTicker}/range/${multiplier}/${timespan}/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=500&apiKey=${POLYGON_KEY}`;
      const resp = await fetch(url);
      const data = await resp.json() as any;
      if (data?.results?.length) {
        const candles = data.results.map((c: any) => ({
          time: Math.floor(c.t / 1000), open: c.o, high: c.h, low: c.l, close: c.c, volume: c.v ?? 0,
        }));
        return res.json({ ticker: ticker.toUpperCase(), timeframe, candles });
      }
    }

    // Fallback to Yahoo Finance for crypto and unsupported assets
    const yahooTicker = assetType === "crypto" ? `${ticker}-USD` : ticker;
    const historical = await (yahooFinance.historical as any)(yahooTicker, {
      period1: fromStr, period2: toStr, interval: "1d",
    }, { validateResult: false });
    const candles = (historical || []).map((c: any) => ({
      time: Math.floor(new Date(c.date).getTime() / 1000),
      open: c.open ?? 0, high: c.high ?? 0, low: c.low ?? 0, close: c.close ?? 0, volume: c.volume ?? 0,
    }));
    res.json({ ticker: ticker.toUpperCase(), timeframe, candles });
  } catch (err) {
    req.log.error({ err }, "Chart data failed");
    res.status(500).json({ error: "Chart data unavailable" });
  }
});

router.get("/market/sectors", requireAuth, async (_req, res) => {
  const SECTORS = [
    { key: "TECH", ticker: "XLK", label: "Technology" },
    { key: "FIN",  ticker: "XLF", label: "Financials" },
    { key: "HLTH", ticker: "XLV", label: "Health Care" },
    { key: "ENER", ticker: "XLE", label: "Energy" },
  ];
  try {
    const results = await Promise.all(
      SECTORS.map(async (s) => {
        const q = await fetchYahooQuote(s.ticker);
        return { key: s.key, label: s.label, ticker: s.ticker, changePct: q?.changePct ?? 0, price: q?.price ?? 0 };
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sector data" });
  }
});

router.get("/market/crypto-mcap", requireAuth, async (_req, res) => {
  try {
    const [quote, historical] = await Promise.all([
      (yahooFinance.quote as any)("^CRYUSD", {}, { validateResult: false }),
      (yahooFinance.historical as any)("^CRYUSD", {
        period1: new Date(Date.now() - 8 * 86400000).toISOString().split("T")[0],
        period2: new Date().toISOString().split("T")[0],
        interval: "1d",
      }, { validateResult: false }).catch(() => []),
    ]);
    const mcap = quote?.regularMarketPrice ?? 0;
    const changePct = quote?.regularMarketChangePercent ?? 0;
    const bars = (historical || []).map((c: any) => ({
      date: new Date(c.date).toLocaleDateString("en-US", { weekday: "short" }),
      value: c.close ?? 0,
    }));
    res.json({ mcap, changePct, bars });
  } catch {
    res.status(500).json({ error: "Failed to fetch crypto market cap" });
  }
});

router.get("/market/rate/ngn", async (_req, res) => {
  try {
    const q = await (yahooFinance.quote as any)("USDNGN=X", {}, { validateResult: false });
    const rate = q?.regularMarketPrice ?? DEFAULT_NGN_RATE;
    res.json({ rate, updatedAt: new Date().toISOString() });
  } catch {
    res.json({ rate: DEFAULT_NGN_RATE, updatedAt: new Date().toISOString() });
  }
});

export default router;
