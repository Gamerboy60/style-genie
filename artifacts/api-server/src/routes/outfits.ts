import { Router } from "express";
import { db } from "@workspace/db";
import { clothingItems, outfits, outfitItems } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import {
  CreateOutfitBody,
  GenerateOutfitBody,
  DeleteOutfitParams,
} from "@workspace/api-zod";
import { GoogleGenAI } from "@google/genai";

const router = Router();

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function toClothingItemResponse(item: typeof clothingItems.$inferSelect) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
  };
}

async function getOutfitWithItems(outfitId: number) {
  const outfit = await db.select().from(outfits).where(eq(outfits.id, outfitId));
  if (!outfit[0]) return null;

  const items = await db
    .select({ clothingItemId: outfitItems.clothingItemId })
    .from(outfitItems)
    .where(eq(outfitItems.outfitId, outfitId));

  const clothingItemIds = items.map((i) => i.clothingItemId);
  const clothingItemsList = clothingItemIds.length > 0
    ? await db.select().from(clothingItems).where(inArray(clothingItems.id, clothingItemIds))
    : [];

  return {
    ...outfit[0],
    createdAt: outfit[0].createdAt.toISOString(),
    clothingItemIds,
    clothingItems: clothingItemsList.map(toClothingItemResponse),
  };
}

router.get("/outfits", async (req, res) => {
  try {
    const allOutfits = await db.select().from(outfits).orderBy(outfits.createdAt);
    const results = await Promise.all(allOutfits.map((o) => getOutfitWithItems(o.id)));
    res.json(results.filter(Boolean));
  } catch (err) {
    req.log.error({ err }, "Failed to list outfits");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/outfits", async (req, res) => {
  const parsed = CreateOutfitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const [outfit] = await db
      .insert(outfits)
      .values({ name: parsed.data.name, occasion: parsed.data.occasion, notes: parsed.data.notes })
      .returning();

    if (parsed.data.clothingItemIds && parsed.data.clothingItemIds.length > 0) {
      await db.insert(outfitItems).values(
        parsed.data.clothingItemIds.map((cid) => ({ outfitId: outfit.id, clothingItemId: cid }))
      );
    }

    const result = await getOutfitWithItems(outfit.id);
    res.status(201).json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to create outfit");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/outfits/generate", async (req, res) => {
  const parsed = GenerateOutfitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const allItems = await db.select().from(clothingItems);

    if (allItems.length < 2) {
      res.json([]);
      return;
    }

    const itemDescriptions = allItems.map((item) =>
      `ID ${item.id}: ${item.name} (${item.category}${item.color ? `, ${item.color}` : ""}${item.style ? `, ${item.style}` : ""}${item.occasion ? `, ${item.occasion}` : ""}${item.season ? `, ${item.season}` : ""})`
    ).join("\n");

    const filters = [
      parsed.data.occasion ? `Occasion: ${parsed.data.occasion}` : null,
      parsed.data.mood ? `Mood: ${parsed.data.mood}` : null,
      parsed.data.weather ? `Weather: ${parsed.data.weather}` : null,
    ].filter(Boolean).join(", ");

    const count = parsed.data.count ?? 3;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            {
              text: `You are a personal stylist. Create ${count} outfit suggestion(s) from this wardrobe.
${filters ? `Preferences: ${filters}` : ""}

Available clothing items:
${itemDescriptions}

Return a JSON array with ${count} outfit(s). Each outfit must have:
- clothingItemIds: array of item IDs from the list (2-5 items per outfit)
- reasoning: 1-2 sentence explanation of why these pieces work together
- occasion: what occasion this outfit is for
- style: the style name for this outfit

Only use IDs from the list above. Return only valid JSON array, no markdown.`,
            },
          ],
        },
      ],
    });

    const raw = response.text ?? "[]";
    const content = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let suggestions: Array<{ clothingItemIds: number[]; reasoning: string; occasion: string; style: string }> = [];
    try {
      suggestions = JSON.parse(content);
    } catch {
      req.log.warn({ content }, "Failed to parse outfit suggestions JSON");
    }

    const itemMap = new Map(allItems.map((i) => [i.id, i]));

    const result = suggestions.map((suggestion) => ({
      clothingItems: (suggestion.clothingItemIds ?? [])
        .map((id) => itemMap.get(id))
        .filter(Boolean)
        .map((item) => toClothingItemResponse(item!)),
      reasoning: suggestion.reasoning ?? "",
      occasion: suggestion.occasion ?? "",
      style: suggestion.style ?? "",
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to generate outfit");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/outfits/:id", async (req, res) => {
  const parsed = DeleteOutfitParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    await db.delete(outfitItems).where(eq(outfitItems.outfitId, parsed.data.id));
    await db.delete(outfits).where(eq(outfits.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete outfit");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
