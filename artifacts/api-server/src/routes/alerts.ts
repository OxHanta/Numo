import { Router } from "express";
import { db, alerts, alertHistory } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "./auth";
import { CreateAlertBody, DeleteAlertParams, SnoozeAlertParams, SnoozeAlertBody } from "@workspace/api-zod";

const router = Router();

function toNum(v: string | null | undefined) {
  return v ? parseFloat(v) : null;
}

function snoozeMs(duration: string): number {
  if (duration === "1h") return 3600000;
  if (duration === "4h") return 14400000;
  return 86400000;
}

router.get("/alerts", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const rows = await db.select().from(alerts).where(eq(alerts.userId, userId)).orderBy(desc(alerts.createdAt));
    res.json(rows.map((a) => ({
      ...a, targetPrice: toNum(a.targetPrice), pctThreshold: toNum(a.pctThreshold),
      createdAt: a.createdAt.toISOString(), lastTriggeredAt: a.lastTriggeredAt?.toISOString() ?? null,
      snoozedUntil: a.snoozedUntil?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Get alerts failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/alerts", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = CreateAlertBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { ticker, name, alertType, targetPrice, pctThreshold } = parsed.data;
  try {
    const [alert] = await db.insert(alerts).values({
      userId, ticker: ticker.toUpperCase(), name, alertType,
      targetPrice: targetPrice != null ? String(targetPrice) : null,
      pctThreshold: pctThreshold != null ? String(pctThreshold) : null,
    }).returning();
    res.status(201).json({ ...alert, targetPrice: toNum(alert.targetPrice), pctThreshold: toNum(alert.pctThreshold),
      createdAt: alert.createdAt.toISOString(), lastTriggeredAt: null, snoozedUntil: null });
  } catch (err) {
    req.log.error({ err }, "Create alert failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/alerts/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = DeleteAlertParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  try {
    await db.delete(alerts).where(and(eq(alerts.id, parsed.data.id), eq(alerts.userId, userId)));
    res.json({ success: true, message: "Alert deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete alert failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/alerts/:id/snooze", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const paramsParsed = SnoozeAlertParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: paramsParsed.error.issues });
  const bodyParsed = SnoozeAlertBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.issues });
  try {
    const snoozedUntil = new Date(Date.now() + snoozeMs(bodyParsed.data.duration));
    const [alert] = await db.update(alerts).set({ snoozedUntil })
      .where(and(eq(alerts.id, paramsParsed.data.id), eq(alerts.userId, userId)))
      .returning();
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json({ ...alert, targetPrice: toNum(alert.targetPrice), pctThreshold: toNum(alert.pctThreshold),
      createdAt: alert.createdAt.toISOString(), lastTriggeredAt: alert.lastTriggeredAt?.toISOString() ?? null,
      snoozedUntil: alert.snoozedUntil?.toISOString() ?? null });
  } catch (err) {
    req.log.error({ err }, "Snooze alert failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/alerts/history", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const rows = await db.select().from(alertHistory)
      .where(eq(alertHistory.userId, userId))
      .orderBy(desc(alertHistory.triggeredAt))
      .limit(100);
    res.json(rows.map((h) => ({
      ...h, priceAtTrigger: parseFloat(h.priceAtTrigger), targetPrice: toNum(h.targetPrice),
      triggeredAt: h.triggeredAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Alert history failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
