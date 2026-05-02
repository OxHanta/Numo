import { pgTable, serial, text, timestamp, numeric, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const portfolioPositions = pgTable("portfolio_positions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  ticker: text("ticker").notNull(),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(),
  quantity: numeric("quantity", { precision: 20, scale: 8 }).notNull(),
  avgBuyPrice: numeric("avg_buy_price", { precision: 20, scale: 8 }).notNull(),
  purchaseDate: date("purchase_date").notNull(),
  isClosed: boolean("is_closed").default(false).notNull(),
  closedAt: timestamp("closed_at"),
  finalPnl: numeric("final_pnl", { precision: 20, scale: 8 }),
});

export const insertPortfolioPositionSchema = createInsertSchema(portfolioPositions).omit({
  id: true,
  isClosed: true,
  closedAt: true,
  finalPnl: true,
});
export type InsertPortfolioPosition = z.infer<typeof insertPortfolioPositionSchema>;
export type PortfolioPosition = typeof portfolioPositions.$inferSelect;
