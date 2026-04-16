# Aspiron Email Signature Generator

Web app that bakes custom fonts (Zalando Sans Expanded, Zalando Sans, IBM Plex Mono) into a PNG so email clients can't strip them. Uploads the PNG to Cloudflare R2 and generates the signature HTML with the public URL filled in.

## Stack
- **Cloudflare Pages** — static site (`/public`)
- **Cloudflare Pages Functions** — `/functions/api/upload.ts` writes to R2
- **Cloudflare R2** — public bucket `aspiron-signatures`

## First-time Cloudflare setup

1. **R2 bucket** `aspiron-signatures` → enable public access via r2.dev subdomain (already done: `https://pub-376c070665f24d80ac2828a67b43160a.r2.dev`).
2. **Pages project** → connect this GitHub repo. Build command: *(none)*. Output dir: `public`.
3. **Pages → Settings → Functions → R2 bucket bindings**: add `SIGNATURES` → `aspiron-signatures` (for Production AND Preview).
4. **Pages → Settings → Environment variables** (Production + Preview, encrypted):
   - `UPLOAD_SECRET` = long random string.
5. **R2 → Settings → CORS**:
   ```json
   [{"AllowedOrigins":["https://<your-pages-domain>.pages.dev","http://localhost:8788"],"AllowedMethods":["GET","PUT","POST","HEAD"],"AllowedHeaders":["*"],"MaxAgeSeconds":3600}]
   ```

## Local dev

```bash
npm install -g wrangler
wrangler login

# create a local secret file (gitignored)
echo 'UPLOAD_SECRET=localdevsecret' > .dev.vars

wrangler pages dev public
```

Opens on `http://localhost:8788`. The R2 binding and `UPLOAD_SECRET` come from `wrangler.toml` + `.dev.vars`. First upload, the browser prompts for the secret — enter what you put in `.dev.vars`.

## Deploy

Pushing to `main` on GitHub auto-deploys via Pages. Or manually:

```bash
wrangler pages deploy public
```

## How it works

1. User fills form → canvas renders text onto background PNG using Google Fonts via `document.fonts.load`.
2. Click **Upload PNG to R2** → browser POSTs the canvas blob to `/api/upload` with `X-Upload-Secret` header.
3. Function validates secret, hashes content (SHA-256, 16 hex chars), stores as `<slug>-<hash>.png` in R2 with `Cache-Control: immutable`.
4. Function returns `{ url }`; generator fills it into the HTML template.
5. User copies/downloads the HTML → paste into Gmail/Outlook signature editor.

## Text layout (locked)

| Field | Font | Size | Position |
|---|---|---|---|
| Name | Zalando Sans Expanded 700 | 24 pt | (30, 30) |
| Position | Zalando Sans 400 | 18 pt | (30, 60) |
| Phone | IBM Plex Mono 600 label / 400 value | 11 px | (30, 106) |
| Email | IBM Plex Mono 600 label / 400 value | 11 px | (30, 120) |

All text `#000000`.
