import { Router } from "express";
import { requireAuth } from "./auth";
import { db, watchlistItems } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetNewsFeedQueryParams } from "@workspace/api-zod";

const router = Router();
const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

function mapSentiment(s: number): "bullish" | "neutral" | "bearish" {
  if (s > 0.2) return "bullish";
  if (s < -0.2) return "bearish";
  return "neutral";
}

router.get("/news", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = GetNewsFeedQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  try {
    const items = await db.select().from(watchlistItems).where(eq(watchlistItems.userId, userId));
    const tickers = items.map((i) => i.ticker);
    if (tickers.length === 0) {
      return res.json({ articles: [], page, hasMore: false });
    }
    // Fetch company news for first 3 tickers (rate limit friendly)
    const ticker = tickers[0];
    const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const to = new Date().toISOString().split("T")[0];
    const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json() as any[];
    const perPage = 20;
    const start = (page - 1) * perPage;
    const slice = data.slice(start, start + perPage);
    const articles = slice.map((a: any) => ({
      id: String(a.id),
      headline: a.headline,
      source: a.source,
      url: a.url,
      publishedAt: new Date(a.datetime * 1000).toISOString(),
      summary: a.summary || null,
      image: a.image || null,
      tickers: [ticker],
      sentiment: mapSentiment(a.sentiment ?? 0),
    }));
    res.json({ articles, page, hasMore: data.length > start + perPage });
  } catch (err) {
    req.log.error({ err }, "News feed failed");
    res.status(500).json({ error: "News unavailable" });
  }
});

router.get("/news/market", requireAuth, async (req, res) => {
  try {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json() as any[];
    const articles = (data ?? []).slice(0, 30).map((a: any) => ({
      id: String(a.id),
      headline: a.headline,
      source: a.source,
      url: a.url,
      publishedAt: new Date(a.datetime * 1000).toISOString(),
      summary: a.summary || null,
      image: a.image || null,
      tickers: [],
      sentiment: null,
    }));
    res.json(articles);
  } catch (err) {
    req.log.error({ err }, "Market news failed");
    res.status(500).json({ error: "News unavailable" });
  }
});

export default router;
