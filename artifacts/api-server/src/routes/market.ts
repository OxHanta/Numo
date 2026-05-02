import { Router } from "express";
import { requireAuth } from "./auth";
import { GetChartDataParams, GetChartDataQueryParams, GetQuoteParams, SearchAssetsQueryParams } from "@workspace/api-zod";

const router = Router();
const POLYGON_KEY = process.env.POLYGON_API_KEY;

// Timeframe → Polygon multiplier/timespan/from
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

export async function fetchQuote(ticker: string, assetType?: string): Promise<{
  ticker: string; price: number; open: number; high: number; low: number;
  previousClose: number; change: number; changePct: number; volume: number | null; updatedAt: string;
} | null> {
  if (!POLYGON_KEY) return null;
  const t = assetType === "crypto" ? `X:${ticker}USD` : ticker.toUpperCase();
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/${assetType === "crypto" ? "crypto" : "stocks"}/tickers/${t}?apiKey=${POLYGON_KEY}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json() as any;
    const snap = data?.ticker || data?.tickers?.[0];
    if (!snap) return null;
    const d = snap.day ?? {};
    const pd = snap.prevDay ?? {};
    const price = snap.lastTrade?.p ?? snap.lastQuote?.P ?? d.c ?? 0;
    const prevClose = pd.c ?? snap.prevDay?.c ?? 0;
    const change = price - prevClose;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;
    return {
      ticker: ticker.toUpperCase(),
      price,
      open: d.o ?? price,
      high: d.h ?? price,
      low: d.l ?? price,
      previousClose: prevClose,
      change,
      changePct,
      volume: d.v ?? null,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

router.get("/market/search", requireAuth, async (req, res) => {
  const parsed = SearchAssetsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const q = parsed.data.q;
  try {
    const url = `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(q)}&active=true&limit=10&apiKey=${POLYGON_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json() as any;
    const results = (data?.results ?? []).map((r: any) => ({
      ticker: r.ticker,
      name: r.name,
      assetType: r.market === "crypto" ? "crypto" : r.type === "ETF" ? "etf" : "stock",
      exchange: r.primary_exchange ?? null,
    }));
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/market/quote/:ticker", requireAuth, async (req, res) => {
  const parsed = GetQuoteParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { ticker } = parsed.data;
  const quote = await fetchQuote(ticker);
  if (!quote) return res.status(404).json({ error: "Quote not available" });
  res.json(quote);
});

router.get("/market/chart/:ticker", requireAuth, async (req, res) => {
  const paramsParsed = GetChartDataParams.safeParse(req.params);
  const queryParsed = GetChartDataQueryParams.safeParse(req.query);
  if (!paramsParsed.success) return res.status(400).json({ error: paramsParsed.error.issues });
  const { ticker } = paramsParsed.data;
  const timeframe = (queryParsed.success ? queryParsed.data.timeframe : "1M") ?? "1M";
  const { multiplier, timespan, daysBack } = timeframeToPolygon(timeframe);
  const to = new Date();
  const from = new Date(Date.now() - daysBack * 86400000);
  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];
  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker.toUpperCase()}/range/${multiplier}/${timespan}/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=500&apiKey=${POLYGON_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json() as any;
    const candles = (data?.results ?? []).map((c: any) => ({
      time: Math.floor(c.t / 1000),
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
      volume: c.v ?? 0,
    }));
    res.json({ ticker: ticker.toUpperCase(), timeframe, candles });
  } catch (err) {
    req.log.error({ err }, "Chart data failed");
    res.status(500).json({ error: "Chart data unavailable" });
  }
});

export default router;
