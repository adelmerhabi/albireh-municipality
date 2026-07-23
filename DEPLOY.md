# Deploying the Al‑Bireh municipality website (self‑owned, free)

This app is a single **Cloudflare Worker** that serves the public Arabic/RTL
site, the admin dashboard, and the API. It uses two Cloudflare resources:

- **D1** (SQLite) — content, resident requests, admin users, audit log.
- **R2** (object storage) — uploaded images and files.

Everything below runs on Cloudflare's **free tier**, which is more than enough
for a ~6,000‑resident municipality (Workers 100k requests/day, D1 5 GB, R2
10 GB with no egress fees). Unlike some free platforms, Cloudflare Workers/D1/R2
**never sleep**.

The goal of this document is that the **municipality owns everything** — the
account, the database, the files, the domain, and the deploys. No third party
sits in the middle.

---

## 0. One‑time prerequisites (on the machine you deploy from)

- A free **Cloudflare account** — https://dash.cloudflare.com/sign-up
- **Node.js ≥ 22.13** — https://nodejs.org
- Install dependencies once: `npm install`
- Wrangler is already a dev dependency; call it with `npx wrangler …`.

Sign in (opens a browser once):

```bash
npx wrangler login
```

---

## 1. Create the database and storage bucket (in YOUR account)

```bash
npx wrangler d1 create site-creator-d1
npx wrangler r2 bucket create site-creator-r2
```

`d1 create` prints a **`database_id`** — copy it. Keep the names
`site-creator-d1` and `site-creator-r2` so they match the build output (only
the id differs from the placeholder).

> The R2 bucket is matched by **name**, so nothing else is needed for it.

---

## 2. Build with your database id

Set the id as an environment variable so the generated Cloudflare config points
at your real database (see `vite.config.ts`):

```bash
# macOS / Linux
CF_D1_DATABASE_ID=<your-database-id> npm run build
```

```powershell
# Windows PowerShell
$env:CF_D1_DATABASE_ID="<your-database-id>"; npm run build
```

The build writes `dist/server/wrangler.json` (Worker config) and
`dist/client/` (static assets).

> **Fallback if the id is still the placeholder** (`00000000-…`) after build:
> open `dist/server/wrangler.json` and replace the `database_id` value in the
> `d1_databases` entry with your real id before deploying. Nothing else needs
> to change.

---

## 3. Initialize the database

You have two options — **either** works:

- **Do nothing.** The app self‑creates every table and column on the first
  request (`db/runtime.ts` → `ensureRuntimeSchema`, idempotent). A brand‑new
  D1 will initialize itself, including the Wish campaign columns.
- **Or apply the Drizzle migrations explicitly** (optional, e.g. if you want the
  schema present before first traffic):

  ```bash
  npx wrangler d1 migrations apply site-creator-d1 --remote
  ```

  (Run from the project root; the SQL lives in `drizzle/`.)

---

## 4. Set production secrets

These replace the temporary values baked into the code. Set them against the
deployed Worker (`site-creator-vinext-starter` unless you renamed it — see
step 7). Run each and paste the value when prompted:

```bash
npx wrangler secret put ADMIN_SESSION_SECRET          # long random string
npx wrangler secret put ADMIN_BOOTSTRAP_USERNAME      # e.g. admin
npx wrangler secret put ADMIN_BOOTSTRAP_PASSWORD_HASH # pbkdf2 hash, see below
npx wrangler secret put ADMIN_BOOTSTRAP_DISPLAY_NAME  # e.g. مدير الموقع
```

Generate a compatible `ADMIN_BOOTSTRAP_PASSWORD_HASH` (PBKDF2‑SHA256, 210k
iterations — the format the login route expects):

```powershell
# Windows PowerShell — replace YOUR_PASSWORD
$p='YOUR_PASSWORD'; $s=[byte[]]::new(16); [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($s); $k=[System.Security.Cryptography.Rfc2898DeriveBytes]::new([Text.Encoding]::UTF8.GetBytes($p),$s,210000,'SHA256'); 'pbkdf2-sha256$210000$'+[Convert]::ToBase64String($s)+'$'+[Convert]::ToBase64String($k.GetBytes(32))
```

```bash
# macOS / Linux (node) — replace YOUR_PASSWORD
node -e 'const c=require("crypto");const s=c.randomBytes(16);const k=c.pbkdf2Sync("YOUR_PASSWORD",s,210000,32,"sha256");console.log("pbkdf2-sha256$210000$"+s.toString("base64")+"$"+k.toString("base64"))'
```

> Secrets can be set after the first deploy too; the Worker just needs to exist.
> If a command says the Worker isn't found, do step 5 first, then set secrets.

---

## 5. Deploy

```bash
cd dist/server
npx wrangler deploy
```

When it finishes it prints your live URL:

```
https://site-creator-vinext-starter.<your-subdomain>.workers.dev
```

Open it, go to `/admin/login`, and sign in with the bootstrap username +
password from step 4.

---

## 6. Redeploying after changes

```bash
CF_D1_DATABASE_ID=<your-database-id> npm run build   # from project root
cd dist/server && npx wrangler deploy
```

Data in D1/R2 is preserved across deploys.

---

## 7. (Optional) Rename the Worker / URL

The Worker name (and the `*.workers.dev` slug) comes from the `name` field in
`package.json`. To get `al-bireh.<subdomain>.workers.dev`, change:

```json
"name": "al-bireh-municipality"
```

then rebuild and redeploy. (Do this **before** attaching a custom domain.)

---

## 8. Custom `.lb` domain

`.lb` domains are **not instant** — they are approved manually, so launch on the
free `*.workers.dev` URL now and attach the domain when it's granted.

**Registry & process (as of 2026):**

- `.lb` is run by the **Lebanese Domain Registry (LBDR)**. Since Feb 2021 you
  must register **through an accredited registrar**, not directly.
- For an official **`gov.lb`** name (e.g. `albireh.gov.lb`), registration is
  **restricted to Lebanese government departments** and goes through **OMSAR** —
  the registrar emails the LBDR‑A form and supporting documents to
  `govlbdr@omsar.gov.lb`. A municipality (بلدية) qualifies but must provide
  official proof and authorization. This is the most legitimate option and
  worth pursuing for a municipality.
- Faster alternatives while `gov.lb` is processed: **`.org.lb`** or **`.com.lb`**
  via an LBDR registrar with proof of the entity.

**Connecting the domain to the Worker (once you have it):**

1. In the Cloudflare dashboard, **Add a site** for the domain (e.g.
   `albireh.gov.lb`) — choose the Free plan.
2. Cloudflare gives you two **nameservers**. Ask your `.lb` registrar / OMSAR to
   set those as the domain's authoritative nameservers.
3. After the domain is active in Cloudflare: **Workers & Pages → your Worker →
   Settings → Domains & Routes → Add custom domain** → enter the hostname.
   Cloudflare provisions HTTPS automatically.

Sources for `.lb` details:
- LBDR — https://lbdr.org.lb/register-domain/
- `.gov.lb` / OMSAR — https://www.bb-online.com/tldinformation/gov.lb.shtml
- Overview — https://en.wikipedia.org/wiki/.lb

---

## 9. Backups (recommended)

- **Database:** `npx wrangler d1 export site-creator-d1 --remote --output backup.sql`
- **Files:** R2 objects can be copied with `npx wrangler r2 object get …` or via
  the dashboard. Keep periodic copies off Cloudflare for safety.

---

## What must be set manually (summary)

| Item | Where | Notes |
|------|-------|-------|
| Cloudflare account | dash.cloudflare.com | Owned by the municipality |
| `CF_D1_DATABASE_ID` | build env var | From `wrangler d1 create` |
| `ADMIN_SESSION_SECRET` | `wrangler secret put` | Random; replaces hardcoded temp value |
| `ADMIN_BOOTSTRAP_PASSWORD_HASH` | `wrangler secret put` | PBKDF2 hash of the admin password |
| `ADMIN_BOOTSTRAP_USERNAME` / `_DISPLAY_NAME` | `wrangler secret put` | Optional; default `admin` / «مدير الموقع» |
| `.lb` domain | LBDR registrar / OMSAR | Manual approval, then attach in Cloudflare |
