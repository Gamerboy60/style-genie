import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const outfits = pgTable("outfits", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  occasion: text("occasion"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const outfitItems = pgTable("outfit_items", {
  id: serial("id").primaryKey(),
  outfitId: integer("outfit_id").notNull(),
  clothingItemId: integer("clothing_item_id").notNull(),
});

export const insertOutfitSchema = createInsertSchema(outfits).omit({ id: true, createdAt: true });
export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type Outfit = typeof outfits.$inferSelect;
export type OutfitItem = typeof outfitItems.$inferSelect;
