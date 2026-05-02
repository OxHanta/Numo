import { Router } from "express";
import { db, watchlistItems } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth";
import { AddToWatchlistBody, RemoveFromWatchlistParams } from "@workspace/api-zod";
import { fetchQuote } from "./market";

const router = Router();

router.get("/watchlist", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const items = await db.select().from(watchlistItems).where(eq(watchlistItems.userId, userId));
    // Enrich with live prices (best-effort, no error if API fails)
    const enriched = await Promise.all(
      items.map(async (item) => {
        try {
          const quote = await fetchQuote(item.ticker, item.assetType);
          return {
            ...item,
            addedAt: item.addedAt.toISOString(),
            currentPrice: quote?.price ?? null,
            priceChange: quote?.change ?? null,
            priceChangePct: quote?.changePct ?? null,
          };
        } catch {
          return {
            ...item,
            addedAt: item.addedAt.toISOString(),
            currentPrice: null,
            priceChange: null,
            priceChangePct: null,
          };
        }
      })
    );
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to get watchlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/watchlist", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = AddToWatchlistBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { ticker, name, assetType } = parsed.data;
  try {
    const [item] = await db
      .insert(watchlistItems)
      .values({ userId, ticker: ticker.toUpperCase(), name, assetType })
      .returning();
    res.status(201).json({ ...item, addedAt: item.addedAt.toISOString(), currentPrice: null, priceChange: null, priceChangePct: null });
  } catch (err: any) {
    if (err?.code === "23505") return res.status(409).json({ error: "Asset already in watchlist" });
    req.log.error({ err }, "Failed to add to watchlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/watchlist/:ticker", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = RemoveFromWatchlistParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    await db.delete(watchlistItems).where(
      and(eq(watchlistItems.userId, userId), eq(watchlistItems.ticker, parsed.data.ticker.toUpperCase()))
    );
    res.json({ success: true, message: "Removed from watchlist" });
  } catch (err) {
    req.log.error({ err }, "Failed to remove from watchlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/watchlist/movers", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const items = await db.select().from(watchlistItems).where(eq(watchlistItems.userId, userId));
    const enriched = await Promise.all(
      items.map(async (item) => {
        try {
          const quote = await fetchQuote(item.ticker, item.assetType);
          return {
            ...item,
            addedAt: item.addedAt.toISOString(),
            currentPrice: quote?.price ?? null,
            priceChange: quote?.change ?? null,
            priceChangePct: quote?.changePct ?? null,
          };
        } catch {
          return { ...item, addedAt: item.addedAt.toISOString(), currentPrice: null, priceChange: null, priceChangePct: null };
        }
      })
    );
    const withChange = enriched.filter((i) => i.priceChangePct !== null) as (typeof enriched[number] & { priceChangePct: number })[];
    withChange.sort((a, b) => (b.priceChangePct ?? 0) - (a.priceChangePct ?? 0));
    res.json({ gainers: withChange.slice(0, 3), losers: withChange.slice(-3).reverse() });
  } catch (err) {
    req.log.error({ err }, "Failed to get movers");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
