# Kirana POS v2 — Smart Billing System

## What's New in v2
- Groq Vision AI (free, fast — Anthropic replace)
- Offline mode (IndexedDB — internet lekapoina work)
- Stock auto-deduct after every bill
- Bill print (thermal/browser)
- WhatsApp bill share
- Week sales chart
- Cart lo quick search & add
- PWA — phone lo install cheyyachu
- Pending offline bills auto-sync

## Railway Deploy — Step by Step

### Step 1 — GitHub Push
```bash
git init && git add . && git commit -m "kirana-pos-v2"
git remote add origin https://github.com/yourname/kirana-pos.git
git push -u origin main
```

### Step 2 — Railway Project
1. https://railway.app → New Project
2. Deploy from GitHub → select repo
3. New → Database → PostgreSQL

### Step 3 — Backend Service
- New → GitHub Repo → Root Directory: `backend`
- Variables tab → Add all:

```
DATABASE_URL     = (Railway auto-inject from PostgreSQL)
GROQ_API_KEY     = gsk_your_new_groq_key_here
PORT             = 8080
NODE_ENV         = production
FRONTEND_URL     = https://your-frontend.up.railway.app
```

### Step 4 — Frontend Service
- New → GitHub Repo → Root Directory: `frontend`
- Variables tab:

```
NEXT_PUBLIC_API_URL   = https://your-backend.up.railway.app
NEXT_PUBLIC_UPI_ID    = yourshop@ybl
NEXT_PUBLIC_SHOP_NAME = My Kirana Store
```

### Step 5 — Seed Products
Backend Railway shell:
```bash
npm run seed
```
12 Indian products ready!

### Step 6 — Verify
- App: https://your-frontend.up.railway.app
- Health: https://your-backend.up.railway.app/api/health

---

## Get Groq API Key (Free)
1. https://console.groq.com
2. API Keys → Create Key
3. Copy → Railway backend GROQ_API_KEY variable lo paste

---

## Product Lookup Flow
```
Barcode scan
  → IndexedDB (instant, offline)
  → PostgreSQL local DB (fast)
  → Open Food Facts API (crores of products)
  → Groq Vision AI (photo detect)
  → Manual entry → save to DB
```

## API Routes
```
GET  /api/health
GET  /api/products              All products
GET  /api/products/search?q=    Search (+ Groq AI fallback)
GET  /api/products/barcode/:bc  Barcode lookup
POST /api/products              Save product
PATCH /api/products/:id         Update
DELETE /api/products/:id        Delete
POST /api/ai/detect             Groq Vision detection
POST /api/bills                 Save bill + auto stock deduct
GET  /api/bills                 Bill history
GET  /api/stats                 Dashboard + week chart
```

## Railway Environment Variables

### Backend (required)
| Variable | Value |
|---|---|
| DATABASE_URL | Railway PostgreSQL auto-inject |
| GROQ_API_KEY | gsk_... from console.groq.com |
| PORT | 8080 |
| NODE_ENV | production |
| FRONTEND_URL | https://your-frontend.up.railway.app |

### Frontend (required)
| Variable | Value |
|---|---|
| NEXT_PUBLIC_API_URL | https://your-backend.up.railway.app |
| NEXT_PUBLIC_UPI_ID | yourshop@ybl |
| NEXT_PUBLIC_SHOP_NAME | My Kirana Store |
