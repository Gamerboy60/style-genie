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
import { GoogleGenAI } from "@google/genai";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const objectStorageService = new ObjectStorageService();

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

    let base64Image: string;
    let mimeType: string;

    if (item.imagePath) {
      // Read directly from object storage — avoids any HTTP round-trip and works
      // identically in dev and production regardless of domain/port differences.
      req.log.info({ imagePath: item.imagePath }, "Loading image from object storage");
      const objectFile = await objectStorageService.getObjectEntityFile(item.imagePath);
      const [metadata] = await objectFile.getMetadata();
      mimeType = (metadata.contentType as string | undefined) ?? "image/jpeg";

      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        const stream = objectFile.createReadStream();
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", resolve);
        stream.on("error", reject);
      });
      const imageBuffer = Buffer.concat(chunks);
      base64Image = imageBuffer.toString("base64");
      req.log.info({ bytes: imageBuffer.length, mimeType }, "Image loaded from storage");
    } else if (item.imageUrl) {
      // Fallback for external URLs stored directly on the item
      req.log.info({ imageUrl: item.imageUrl }, "Fetching image from external URL");
      const imageResp = await fetch(item.imageUrl);
      if (!imageResp.ok) throw new Error(`Failed to fetch image from URL: ${imageResp.status}`);
      const imageBuffer = await imageResp.arrayBuffer();
      base64Image = Buffer.from(imageBuffer).toString("base64");
      mimeType = imageResp.headers.get("content-type") ?? "image/jpeg";
    } else {
      res.status(400).json({ error: "Item has no image to analyze" });
      return;
    }

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Image } },
            {
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

    const raw = response.text ?? "{}";
    const content = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
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
