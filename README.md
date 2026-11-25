# RWH Planner · بارانی پانی پلانر

Rooftop rainwater harvesting planner for Pakistan, in **English and Urdu**.
Enter a city, roof area and household size to get the yearly rainwater harvest, a recommended tank size, a recharge well design, cost and payback, area-scale impact, and a **downloadable PDF design report in English or Urdu**.

Built by Resilience Technologies Labs.

## Architecture

| Part | Folder | Hosting | What it does |
| --- | --- | --- | --- |
| Web app | `frontend/` | Vercel | Vite single-page app. All calculations run instantly in the browser. English/Urdu switch with right-to-left Nastaliq layout. |
| API | `backend/` | Railway (Docker) | Express API. Same calculation engine, plus PDF report generation with headless Chromium. |
| Shared code | `shared/` | – | `calc.js` (engine, rainfall data) and `i18n.js` (English + Urdu text). Copied into both apps by `npm run sync`. |

### API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Service status |
| GET | `/api/cities` | Rainfall normals, roof types, tank sizes, defaults |
| POST | `/api/calculate` | Body: design inputs → full results (JSON) |
| POST | `/api/report?lang=en\|ur` | Body: `{ "inputs": { … } }` → A4 PDF design report |

Design inputs: `city`, `area` (m²), `roof` (`rcc`, `metal`, `tiles`, `paved`), `people`, `lpcd`, `pTank`, `pTanker`, `pPlumb`, `pWell`, `houses`, optional `tank` (litres) and `rain` (12 monthly values in mm).

## Deploy

### 1. Backend on Railway

1. New Project → **Deploy from GitHub repo** → pick this repo.
2. Service **Settings → Source → Root Directory**: `backend`. Railway reads `backend/railway.json` and builds the `Dockerfile`.
3. **Variables** (see `backend/.env.example`):

| Variable | Value |
| --- | --- |
| `ALLOWED_ORIGINS` | Your Vercel URL, e.g. `https://rwh-planner.vercel.app` (comma-separate several; `https://rwh-planner-*.vercel.app` allows preview builds) |
| `REPORT_RATE_LIMIT` | `20` (PDF reports per visitor per 10 minutes) |
| `NODE_ENV` | `production` |

Railway sets `PORT` itself. `PUPPETEER_EXECUTABLE_PATH` is already set in the Docker image.

4. **Settings → Networking → Generate Domain**. Check `https://<your-domain>/api/health`.

### 2. Frontend on Vercel

1. **Add New → Project** → import this repo.
2. **Root Directory**: `frontend`. Framework preset: **Vite** (build `npm run build`, output `dist`).
3. **Environment Variable** (see `frontend/.env.example`):

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | Your Railway URL, e.g. `https://rwh-planner-api.up.railway.app` (no trailing slash) |

4. Deploy. Then put the final Vercel URL into Railway's `ALLOWED_ORIGINS` and redeploy the backend.

## Run locally

```bash
# API (needs Chrome/Chromium installed locally)
cd backend && npm install
PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" ALLOWED_ORIGINS="http://localhost:5173" npm run dev

# Web app
cd frontend && npm install
echo "VITE_API_URL=http://localhost:8080" > .env.local
npm run dev
```

After editing anything in `shared/`, run `npm run sync` in the repo root. `npm run check` fails if the copies drift.

## Method

- Harvest (L) = monthly rainfall (mm) × roof area (m²) × runoff coefficient C × filter efficiency η (0.9).
- Tank performance: monthly water balance, yield-after-spillage, steady third year of a three-year run.
- Recommended tank: smallest standard size giving at least 90% of the water a 30,000 L tank would.
- Recharge well: holds the runoff of one 50 mm storm; 1.2 m diameter, split into more wells beyond 6 m depth.
- Rainfall: long-term monthly normals from each city's Wikipedia climate table (sources listed in `shared/calc.js` and in every report).

Planning estimates only. A qualified engineer should verify the final design.

## Fonts

Noto Nastaliq Urdu and Inter (SIL Open Font License), bundled via `@fontsource` packages and in `backend/src/fonts`.
