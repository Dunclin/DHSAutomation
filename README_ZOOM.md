# DHS Automation – Zoom Integration (Firebase + Cloudflare Worker)

This package gives you:
- A **GitHub Pages** front‑end (single `index.html`) using **Firebase Authentication**.
- A **Cloudflare Worker** backend that:
  - Verifies the Firebase ID token
  - Creates a Zoom instant meeting
  - Registers the signed‑in user (unique **join_url** per user)
  - Returns the link to the front‑end

## Front‑end (GitHub Pages root)
1. Put `index.html` at the **repo root**.
2. Ensure your images exist at:
   - `site-assets/plc-panel-1.png`
   - `site-assets/plc-panel-2.png`

> The page expects your Firebase config (already baked in). Also add your domain to
> Firebase Auth → Settings → **Authorized domains**: `dunclin.github.io`.

### Edit your Worker URL
In `index.html`, search for:
```
https://YOUR_WORKER_SUBDOMAIN.workers.dev/join
```
Replace with your Cloudflare Worker deployment URL.

---

## Cloudflare Worker (serverless backend)
The Worker is in `cloudflare-worker/worker.js`. It needs these **Environment Variables**:

- `FIREBASE_WEB_API_KEY` → your Firebase web API key (from your config)
- `ZOOM_ACCOUNT_ID` → Zoom **Server-to-Server OAuth** account ID
- `ZOOM_CLIENT_ID` → Zoom S2S OAuth client ID
- `ZOOM_CLIENT_SECRET` → Zoom S2S OAuth client secret
- `CORS_ALLOW_ORIGIN` → `https://dunclin.github.io`

### Deploy steps
1. Create a Cloudflare account (free) and install `wrangler`.
2. In your Worker settings, add the **Environment Variables** above.
3. Paste the contents of `cloudflare-worker/worker.js` into your Worker.
4. Deploy; note the URL, e.g. `https://dhs-zoom-worker.yourname.workers.dev`
5. Update the Worker URL in your `index.html` (see **Edit your Worker URL**).

### Zoom setup (Server‑to‑Server OAuth)
1. In the Zoom App Marketplace, create a **Server-to-Server OAuth** app.
2. Copy the **Account ID, Client ID, Client Secret** into Worker env vars.
3. Under **Scopes**, add:
   - `meeting:write:admin`
   - `meeting:read:admin`
   - `user:read:admin` (optional for profile)
4. Activate the app.

> The Worker uses:
> - `POST /oauth/token?grant_type=account_credentials&account_id=...`
> - `POST /v2/users/me/meetings`
> - `POST /v2/meetings/{id}/registrants`

---

## How it works (flow)
1. User signs in on the site (Firebase).
2. User clicks **Get my Zoom link**.
3. Front‑end fetches a **Firebase ID token** and calls your Worker `/join` with `Authorization: Bearer <token>`.
4. Worker verifies the token with Google, creates a Zoom meeting, registers the user, and returns a **unique** join link.
5. The link is shown in the **Remote Work** section.

---

## Troubleshooting
- **CORS error** → Set `CORS_ALLOW_ORIGIN` in Worker to your Pages origin.
- **Firebase 401** → Add `dunclin.github.io` to Authorized Domains.
- **Zoom 401/403** → Check your Zoom S2S credentials and scopes.
- **Images missing** → Ensure `site-assets/plc-panel-*.png` exist at repo root path.

If you want, I can tailor this for Netlify Functions or Vercel instead of a Cloudflare Worker.
