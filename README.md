# Aspiron Email Signature Generator

Web app that bakes custom fonts (Zalando Sans Expanded, Zalando Sans, IBM Plex Mono) into a PNG so email clients can't strip them. Uploads the PNG to Cloudflare R2 and generates the signature HTML with the public URL filled in.

## Stack
- **Cloudflare Worker** with **Static Assets** — serves `/public` + `/api/upload` handler
- **Cloudflare R2** — public bucket `aspiron-signatures`

## First-time Cloudflare setup

1. **R2 bucket** `aspiron-signatures` → public access via r2.dev enabled (`https://pub-376c070665f24d80ac2828a67b43160a.r2.dev`).
2. **Workers project** → connect this GitHub repo. Dashboard settings:
   - Build command: *(empty)*
   - Deploy command: `npx wrangler deploy`
3. **Worker → Settings → Bindings**: add **R2 bucket** binding `SIGNATURES` → `aspiron-signatures`.
4. **Worker → Settings → Variables and Secrets**: add **Secret** `UPLOAD_SECRET` = long random string.
5. **R2 → Settings → CORS**:
   ```json
   [{"AllowedOrigins":["https://aspiron-signature.<subdomain>.workers.dev","http://localhost:8787"],"AllowedMethods":["GET","PUT","POST","HEAD"],"AllowedHeaders":["*"],"MaxAgeSeconds":3600}]
   ```

## Local dev

```bash
npm install
echo 'UPLOAD_SECRET=localdevsecret' > .dev.vars
npx wrangler dev
```

Opens on `http://localhost:8787`. R2 binding + `UPLOAD_SECRET` come from `wrangler.toml` + `.dev.vars`. First upload the browser prompts for the secret.

## Deploy

Pushing to `main` auto-deploys via Workers Git integration. Manual:

```bash
npx wrangler deploy
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
