# OpenRouter gateway (Cloudflare Worker)

The browser cannot keep an API key secret in a public static site. This worker holds **`OPENROUTER_API_KEY`** in Cloudflare; the app only needs the worker’s public HTTPS URL in **`VITE_OPENROUTER_GATEWAY_URL`**.

## Deploy

1. Install Wrangler: `npm i -g wrangler` (or use `npx`).
2. `cd cloudflare-worker` and run `npx wrangler login`.
3. Set the secret: `npx wrangler secret put OPENROUTER_API_KEY` (paste your OpenRouter key).
4. Deploy: `npx wrangler deploy`.
5. Copy the `*.workers.dev` (or custom domain) URL.

## GitHub Pages build

In the repo **Settings → Secrets and variables → Actions → Variables**, add:

- **`VITE_OPENROUTER_GATEWAY_URL`** = `https://<your-worker>.workers.dev` (no trailing slash)

The workflow passes this into `npm run build` so the static bundle calls your worker. That value is not a secret, but **anyone can POST to your worker** unless you add extra checks.

## Abuse / limits

Consider **rate limiting** (e.g. Cloudflare dashboard or Worker KV), **referrer/origin checks**, or an **app token** header if you need stricter control. OpenRouter billing still applies to your key.
