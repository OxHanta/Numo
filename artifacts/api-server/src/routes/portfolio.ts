import { Router } from "express";
import { db, portfolioPositions } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth";
import { AddPortfolioPositionBody, UpdatePortfolioPositionBody, UpdatePortfolioPositionParams, DeletePortfolioPositionParams } from "@workspace/api-zod";
import { fetchQuote } from "./market";

const router = Router();

function toNum(v: string | null | undefined) {
  return v ? parseFloat(v) : 0;
}

router.get("/portfolio/summary", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const positions = await db.select().from(portfolioPositions)
      .where(and(eq(portfolioPositions.userId, userId), eq(portfolioPositions.isClosed, false)));
    let totalValue = 0, totalCost = 0, dayChange = 0;
    await Promise.all(positions.map(async (p) => {
      const qty = toNum(p.quantity);
      const cost = toNum(p.avgBuyPrice) * qty;
      totalCost += cost;
      try {
        const quote = await fetchQuote(p.ticker, p.assetType);
        if (quote) {
          totalValue += quote.price * qty;
          dayChange += quote.change * qty;
        } else {
          totalValue += cost;
        }
      } catch {
        totalValue += cost;
      }
    }));
    const totalPnl = totalValue - totalCost;
    const totalPnlPct = totalCost ? (totalPnl / totalCost) * 100 : 0;
    const dayChangePct = totalValue ? (dayChange / totalValue) * 100 : 0;
    res.json({ totalValue, totalCost, totalPnl, totalPnlPct, dayChange, dayChangePct, positionCount: positions.length });
  } catch (err) {
    req.log.error({ err }, "Portfolio summary failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/portfolio/positions", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const positions = await db.select().from(portfolioPositions).where(eq(portfolioPositions.userId, userId));
    const enriched = await Promise.all(positions.map(async (p) => {
      const qty = toNum(p.quantity);
      const costBasis = toNum(p.avgBuyPrice) * qty;
      let currentPrice = null, currentValue = null, unrealisedPnl = null, unrealisedPnlPct = null;
      if (!p.isClosed) {
        try {
          const quote = await fetchQuote(p.ticker, p.assetType);
          if (quote) {
            currentPrice = quote.price;
            currentValue = quote.price * qty;
            unrealisedPnl = currentValue - costBasis;
            unrealisedPnlPct = costBasis ? (unrealisedPnl / costBasis) * 100 : 0;
          }
        } catch {}
      }
      return {
        id: p.id, ticker: p.ticker, name: p.name, assetType: p.assetType,
        quantity: qty, avgBuyPrice: toNum(p.avgBuyPrice), purchaseDate: p.purchaseDate,
        currentPrice, currentValue, costBasis, unrealisedPnl, unrealisedPnlPct,
        isClosed: p.isClosed, closedAt: p.closedAt?.toISOString() ?? null,
      };
    }));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Portfolio positions failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/portfolio/positions", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = AddPortfolioPositionBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { ticker, name, assetType, quantity, avgBuyPrice, purchaseDate } = parsed.data;
  try {
    const [pos] = await db.insert(portfolioPositions).values({
      userId, ticker: ticker.toUpperCase(), name, assetType,
      quantity: String(quantity), avgBuyPrice: String(avgBuyPrice), purchaseDate,
    }).returning();
    res.status(201).json({ ...pos, quantity: toNum(pos.quantity), avgBuyPrice: toNum(pos.avgBuyPrice),
      costBasis: toNum(pos.quantity) * toNum(pos.avgBuyPrice),
      currentPrice: null, currentValue: null, unrealisedPnl: null, unrealisedPnlPct: null,
      closedAt: null });
  } catch (err) {
    req.log.error({ err }, "Add position failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/portfolio/positions/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const paramsParsed = UpdatePortfolioPositionParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: paramsParsed.error.issues });
  const bodyParsed = UpdatePortfolioPositionBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.issues });
  const { id } = paramsParsed.data;
  const { quantity, avgBuyPrice, purchaseDate } = bodyParsed.data;
  try {
    const updates: any = {};
    if (quantity !== undefined) updates.quantity = String(quantity);
    if (avgBuyPrice !== undefined) updates.avgBuyPrice = String(avgBuyPrice);
    if (purchaseDate !== undefined) updates.purchaseDate = purchaseDate;
    const [pos] = await db.update(portfolioPositions).set(updates)
      .where(and(eq(portfolioPositions.id, id), eq(portfolioPositions.userId, userId)))
      .returning();
    if (!pos) return res.status(404).json({ error: "Position not found" });
    res.json({ ...pos, quantity: toNum(pos.quantity), avgBuyPrice: toNum(pos.avgBuyPrice),
      costBasis: toNum(pos.quantity) * toNum(pos.avgBuyPrice),
      currentPrice: null, currentValue: null, unrealisedPnl: null, unrealisedPnlPct: null,
      closedAt: pos.closedAt?.toISOString() ?? null });
  } catch (err) {
    req.log.error({ err }, "Update position failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/portfolio/positions/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = DeletePortfolioPositionParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    await db.update(portfolioPositions).set({ isClosed: true, closedAt: new Date() })
      .where(and(eq(portfolioPositions.id, parsed.data.id), eq(portfolioPositions.userId, userId)));
    res.json({ success: true, message: "Position closed" });
  } catch (err) {
    req.log.error({ err }, "Delete position failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
