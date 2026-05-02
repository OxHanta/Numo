import { pgTable, serial, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  ticker: text("ticker").notNull(),
  name: text("name").notNull(),
  alertType: text("alert_type").notNull(),
  targetPrice: numeric("target_price", { precision: 20, scale: 8 }),
  pctThreshold: numeric("pct_threshold", { precision: 10, scale: 4 }),
  isActive: boolean("is_active").default(true).notNull(),
  snoozedUntil: timestamp("snoozed_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastTriggeredAt: timestamp("last_triggered_at"),
});

export const alertHistory = pgTable("alert_history", {
  id: serial("id").primaryKey(),
  alertId: serial("alert_id").notNull(),
  userId: text("user_id").notNull(),
  ticker: text("ticker").notNull(),
  alertType: text("alert_type").notNull(),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  priceAtTrigger: numeric("price_at_trigger", { precision: 20, scale: 8 }).notNull(),
  targetPrice: numeric("target_price", { precision: 20, scale: 8 }),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  isActive: true,
  snoozedUntil: true,
  createdAt: true,
  lastTriggeredAt: true,
});
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
export type AlertHistoryEntry = typeof alertHistory.$inferSelect;
