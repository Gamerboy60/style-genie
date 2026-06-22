import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clothingItems = pgTable("clothing_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  color: text("color"),
  style: text("style"),
  occasion: text("occasion"),
  season: text("season"),
  brand: text("brand"),
  notes: text("notes"),
  imageUrl: text("image_url").notNull(),
  imagePath: text("image_path"),
  analyzed: boolean("analyzed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClothingItemSchema = createInsertSchema(clothingItems).omit({ id: true, createdAt: true });
export type InsertClothingItem = z.infer<typeof insertClothingItemSchema>;
export type ClothingItem = typeof clothingItems.$inferSelect;
