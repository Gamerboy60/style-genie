# Wardrobe AI

An AI-powered personal stylist app where you upload photos of your wardrobe and get AI-generated outfit suggestions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/wardrobe-ai run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `OPENAI_API_KEY` — OpenAI API key for AI analysis and outfit generation
- Required env: `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR` — Object storage (auto-set by Replit)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, TanStack React Query, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI (gpt-5-mini) for clothing analysis (vision) and outfit generation
- Storage: Replit Object Storage (GCS-backed) with presigned URL uploads
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/clothing.ts` — ClothingItem table schema
- `lib/db/src/schema/outfits.ts` — Outfit + OutfitItems table schema
- `artifacts/api-server/src/routes/clothing.ts` — clothing CRUD + AI analyze endpoint
- `artifacts/api-server/src/routes/outfits.ts` — outfit CRUD + AI generate endpoint
- `artifacts/api-server/src/routes/storage.ts` — presigned URL upload endpoint
- `artifacts/wardrobe-ai/src/` — React frontend

## Architecture decisions

- OpenAI vision API (gpt-5-mini) analyzes clothing item photos to extract color, style, occasion, and season tags
- Outfit generation uses GPT to pick combinations from the wardrobe given optional filters (occasion, mood, weather)
- Images upload directly to GCS via presigned URLs — the backend only handles metadata, never the file bytes
- Image serving: `GET /api/storage/objects/<objectPath>`

## Product

- Upload clothing photos to build a digital wardrobe
- AI analyzes each piece to tag color, style, occasion, and season
- Generate AI outfit combinations with optional mood/occasion/weather filters
- Save favorite outfits and view wardrobe statistics

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before touching routes or frontend
- Run `pnpm run typecheck:libs` after any lib/* change before checking artifact packages
- Object storage presigned URL flow: 1) POST /api/storage/uploads/request-url → get uploadURL, 2) PUT file directly to uploadURL, 3) store objectPath from response

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
