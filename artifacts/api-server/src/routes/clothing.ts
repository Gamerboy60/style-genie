import { Router } from "express";
import { db } from "@workspace/db";
import { clothingItems } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateClothingItemBody,
  UpdateClothingItemBody,
  GetClothingItemParams,
  UpdateClothingItemParams,
  DeleteClothingItemParams,
  AnalyzeClothingItemParams,
} from "@workspace/api-zod";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function toClothingItemResponse(item: typeof clothingItems.$inferSelect) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/clothing/stats", async (req, res) => {
  try {
    const items = await db.select().from(clothingItems);

    const byCategory: Record<string, number> = {};
    const byColor: Record<string, number> = {};
    const bySeason: Record<string, number> = {};

    for (const item of items) {
      if (item.category) {
        byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
      }
      if (item.color) {
        byColor[item.color] = (byColor[item.color] ?? 0) + 1;
      }
      if (item.season) {
        bySeason[item.season] = (bySeason[item.season] ?? 0) + 1;
      }
    }

    res.json({ totalItems: items.length, byCategory, byColor, bySeason });
  } catch (err) {
    req.log.error({ err }, "Failed to get wardrobe stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/clothing", async (req, res) => {
  try {
    const items = await db.select().from(clothingItems).orderBy(clothingItems.createdAt);
    res.json(items.map(toClothingItemResponse));
  } catch (err) {
    req.log.error({ err }, "Failed to list clothing items");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/clothing", async (req, res) => {
  const parsed = CreateClothingItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const [item] = await db.insert(clothingItems).values(parsed.data).returning();
    res.status(201).json(toClothingItemResponse(item));
  } catch (err) {
    req.log.error({ err }, "Failed to create clothing item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/clothing/:id", async (req, res) => {
  const parsed = GetClothingItemParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [item] = await db.select().from(clothingItems).where(eq(clothingItems.id, parsed.data.id));
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(toClothingItemResponse(item));
  } catch (err) {
    req.log.error({ err }, "Failed to get clothing item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/clothing/:id", async (req, res) => {
  const paramsParsed = UpdateClothingItemParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateClothingItemBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const [item] = await db
      .update(clothingItems)
      .set(bodyParsed.data)
      .where(eq(clothingItems.id, paramsParsed.data.id))
      .returning();
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(toClothingItemResponse(item));
  } catch (err) {
    req.log.error({ err }, "Failed to update clothing item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/clothing/:id", async (req, res) => {
  const parsed = DeleteClothingItemParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    await db.delete(clothingItems).where(eq(clothingItems.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete clothing item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/clothing/:id/analyze", async (req, res) => {
  const parsed = AnalyzeClothingItemParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [item] = await db.select().from(clothingItems).where(eq(clothingItems.id, parsed.data.id));
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const imageUrl = item.imagePath
      ? `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:80"}/api/storage${item.imagePath}`
      : item.imageUrl;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "low" },
            },
            {
              type: "text",
              text: `Analyze this clothing item and return a JSON object with these fields:
- color: main color(s) as a short string (e.g. "navy blue", "white", "black/white stripe")
- style: style descriptor (e.g. "casual", "formal", "streetwear", "preppy", "minimalist", "bohemian")
- occasion: best occasion (e.g. "casual", "work", "formal", "sport", "date", "weekend")
- season: best season (e.g. "spring", "summer", "fall", "winter", "all-season")

Return only valid JSON, no markdown.`,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let analysis: { color?: string; style?: string; occasion?: string; season?: string } = {};
    try {
      analysis = JSON.parse(content);
    } catch {
      req.log.warn({ content }, "Failed to parse AI analysis JSON");
    }

    const [updated] = await db
      .update(clothingItems)
      .set({
        color: analysis.color ?? item.color,
        style: analysis.style ?? item.style,
        occasion: analysis.occasion ?? item.occasion,
        season: analysis.season ?? item.season,
        analyzed: true,
      })
      .where(eq(clothingItems.id, parsed.data.id))
      .returning();

    res.json(toClothingItemResponse(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to analyze clothing item");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
