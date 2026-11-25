# RWH Planner · بارانی پانی پلانر

Rooftop rainwater harvesting planner for Pakistan, in **English and Urdu**.
Enter a city, roof area and household size to get the yearly rainwater harvest, a recommended tank size, a recharge well design, cost and payback, area-scale impact, and a **downloadable PDF design report in English or Urdu**.

Built by Resilience Technologies Labs.

## Architecture

| Part | Folder | Hosting | What it does |
| --- | --- | --- | --- |
| Web app | `frontend/` | Vercel | Vite single-page app. All calculations run instantly in the browser. English/Urdu switch with right-to-left Nastaliq layout. |
| API | `backend/` | Railway (Docker) | Express API. Same calculation engine, plus PDF report generation with headless Chromium. |
| Shared code | `shared/` | – | `calc.js` (engine, rainfall data), `rates.js` (published rates, plot sizes, BOQ items) and `i18n.js` (English + Urdu text). Copied into both apps by `npm run sync`. |

### API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Service status |
| GET | `/api/cities` | Rainfall normals, roof types, tank sizes, plot sizes, rate items, defaults |
| GET | `/api/rates?city=` | Current rates for the cost estimate (PBS live file + rate sheet over published rates), with sources |
| GET | `/api/rates/status` | Which PBS month/file and sheet are in use, and any fetch error |
| POST | `/api/calculate` | Body: design inputs → full results (JSON) |
| POST | `/api/report?lang=en\|ur` | Body: `{ "inputs": { … } }` → A4 PDF design report |

Design inputs: `city`, `plot` (`3m`, `5m`, `7m`, `10m`, `1k`, `2k` or `custom`), `marlaSize` (225 or 272.25), `storeys`, `area` (m², used when `plot` is `custom`), `roof` (`rcc`, `metal`, `tiles`, `paved`), `people`, `lpcd`, `houses`, `contingency` (%), optional `rates` (`{ key: PKR }` overrides), `tank` (litres) and `rain` (12 monthly values in mm).

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
| `RATES_SOURCE_URL` | Optional. Your Google Sheet link (see **Cost estimate and live rates**) |
| `RATES_CACHE_MINUTES` | `360` (how often the rate sheet is re-read) |

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

## Cost estimate and live rates

The app prices a bill of quantities for the chosen plot: 4" uPVC downpipes and elbows, first-flush filters, 2,000 L plastic tanks, the recharge well (bajri, sand, bricks, cement) and plumber, mason and labour days, plus an editable contingency.

Rates come in four layers, each overriding the one before:

1. **Bundled published rates** with source and date (PBS Sept 2026, supplier price lists, KWSC tariff). Used if nothing else is reachable.
2. **PBS, fetched live.** The API finds the newest *Monthly Review on Price Indices* on pbs.gov.pk, downloads its "Urban Construction Items Prices" Excel file and reads city-wise cement, bricks, sand, bajri, mason, labour and plumber prices. Every value is checked against the bundled figures (accepted within 0.5×–2×). Checked daily; no setup needed. `GET /api/rates/status` shows the month and file in use.
3. **Your Google Sheet** for items PBS does not survey (pipes, fittings, tanks, filters, tanker water) and for any correction. Create a sheet with the columns of `rates-template.csv`, share it as *Anyone with the link – Viewer*, and paste its normal link into Railway's `RATES_SOURCE_URL`. The API reads it through Google's open CSV endpoint. Leave `city` blank for all cities, or name a city to override it there only.
4. **The user's own edits** in the Rates table (saved in their browser, included in the PDF and marked as edited).

| Variable | Default | Purpose |
| --- | --- | --- |
| `PBS_LIVE` | `on` | `off` disables the PBS fetch |
| `PBS_CACHE_HOURS` | `24` | How often to look for a new PBS file |
| `PBS_XLSX_URL` | – | Pin a specific PBS Excel file instead of the newest |
| `RATES_SOURCE_URL` | – | Google Sheet link (or any CSV URL) |
| `RATES_CACHE_MINUTES` | `360` | How often the sheet is re-read |

## Training videos and guides

- **Training videos** (`#training`): a public library with categories, search and an in-page player. It starts with six films verified on TheWaterChannel (recharge wells and pits, rooftop harvesting, karez restoration by IUCN Pakistan, check dams, greywater reuse). Uploaded videos are stored in Cloudflare R2 and streamed through short-lived signed links, so the bucket stays private.
- **Admin app** (separate site in `admin/`, see below): sign in with email and password, upload MP4/WebM/MOV files up to 2 GB straight to R2 (with progress, automatic thumbnail and duration), or add YouTube/Vimeo links. Titles and descriptions in English and Urdu, category, language, subtitles, source credit, publish/unpublish, reorder and delete. The catalogue is stored in the bucket as `catalog.json`.
- **Guides** (`#guides`): eight technique guides grouped by the national WASH innovation themes, with a seasonal maintenance calendar.
- **Share link**: the Report tab gives a link that opens the same design for anyone.

| Variable (Railway) | Purpose |
| --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 API token (Object Read & Write on the bucket) |
| `R2_BUCKET` | Bucket name, e.g. `rwh-media` |
| `R2_PUBLIC_URL` | Optional custom-domain URL for the bucket; signed links are used if empty |

**R2 CORS policy** (bucket → Settings → CORS Policy), needed for uploads from the admin page:

```json
[
  {
    "AllowedOrigins": ["https://YOUR-ADMIN.vercel.app"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Admin app (separate site)

`admin/` is its own Vite app with its own URL. Deploy it as a second Vercel project: Root Directory `admin`, env `VITE_API_URL` = the Railway URL. Add its URL to `ALLOWED_ORIGINS` on Railway and to the R2 bucket CORS policy.

Sign-in is email + password (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), giving a 12-hour session signed with `SESSION_SECRET` (a long random string). The password can be changed inside the admin; the new one is stored hashed and replaces `ADMIN_PASSWORD`. After 8 failed attempts the IP is blocked for 10 minutes.

| Tab | What the admin can do |
| --- | --- |
| Videos | Upload, edit, publish/unpublish, reorder, **delete**; translate titles and descriptions English ↔ Urdu with AI |
| Rates | Change or refresh the Google Sheet link, see which source each rate comes from, set or clear per-city overrides |
| AI and keys | Add, replace, **test** (even before saving) and remove OpenAI, Gemini and OpenRouter keys; models, provider order, retries, timeout, cache |
| Account | Change password |

Rates priority (later wins): bundled published rates → PBS file → Google Sheet → admin override → the visitor's own edits. The Google Sheet is the main source; admin overrides are for quick corrections.

Keys saved in the admin are encrypted (AES-256-GCM) with a key derived from `SESSION_SECRET`, never sent back to the browser, and win over keys in environment variables. Changing `SESSION_SECRET` invalidates saved keys.

## AI features

With at least one working key, the public app shows an **AI assistant** tab (answers grounded in the visitor's own design numbers, English and Urdu) and an **AI design review**. The admin gets translation. Providers are tried in the configured order with model fallback, retries and an answer cache.

| Variable (Railway) | Default |
| --- | --- |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` | required for the admin |
| `AI_PROVIDER_ORDER` | `openai,gemini,openrouter` |
| `AI_FALLBACK_ENABLED`, `AI_CACHE_ENABLED`, `AI_LOGGING` | `true` |
| `AI_CACHE_TTL` / `AI_TIMEOUT_MS` / `AI_MAX_RETRIES` | `3600` / `45000` / `3` |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_FALLBACK_MODEL` | `gpt-4.1`, `gpt-4.1-mini` |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL` | `gemini-2.5-flash`, `gemini-2.0-flash` |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODELS` | comma-separated model list |

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
