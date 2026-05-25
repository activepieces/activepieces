# otom8 — how the site and app fit together

This file is duplicated in **`ap`** and **`otom8-site`** so the layout is documented on GitHub. On your machine you may also keep a richer copy at the **parent** folder: `Otom8/CLAUDE.md` (optional; not a git repo).

## Two repos, one product

| Folder | Role | What lives there | Production |
|--------|------|------------------|------------|
| **`ap/`** (this repo) | **App** | Forked Activepieces — flows, builder, pieces, Fastify API, Docker image | `app.otom8.us` (DigitalOcean) |
| **`otom8-site/`** | **Site** | Next.js — marketing pages, Clerk (`/login`, `/signout`), `/api/ap-sso`, `/admin` | `otom8.us` (Vercel) |

They are **sibling folders** (e.g. `Otom8/ap` and `Otom8/otom8-site`). The automation app is **not** inside the site repository.

## Typical local layout

```
Otom8/                          ← you open this in Cursor (often not a git root)
├── CLAUDE.md                   ← optional umbrella notes (local only unless you add a meta-repo)
├── README.md                   ← pointer to the two repos
├── ap/                         ← git: Activepieces fork
└── otom8-site/                 ← git: Next site + scripts
    ├── package.json            ← `pnpm dev` lives here
    ├── scripts/                ← starts ../ap/docker-compose.yml
    └── site/                   ← Next.js app (`site/` is the app directory)
```

## Run everything locally

From **`otom8-site/`** (not from `ap/`):

```bash
pnpm dev:native   # recommended — hot reload for AP + site
```

Starts Postgres + Redis in Docker, everything else natively:
- AP Vite frontend + Clerk login → **http://localhost:4200**
- AP Fastify API → **http://localhost:3000**
- Next.js site + SSO API → **http://localhost:3001**

SSO bootstrap is automatic in `pnpm dev:native`. For Docker AP mode, run
`pnpm dev:bootstrap` once after AP starts. Env:
`otom8-site/site/.env.local` (copy from `.env.local.example`, use `pk_test_*` /
`sk_test_*` Clerk keys for local dev).

**Alternative (Docker AP):** `pnpm dev` — runs full AP in Docker on `:8080`, site on `:3000`. Slower iteration but no native Node.js deps needed.

## Request flow (high level)

1. User hits **localhost:3001** (or **otom8.us**) and clicks login.
2. The site sends the browser to AP login: **localhost:4200/login** (or **app.otom8.us/login**) where Clerk renders.
3. Clerk returns to the site **`/api/ap-sso`** route; the route signs a JWT and exchanges it with AP’s **`/api/v1/managed-authn/external-token`**.
4. Browser lands on **localhost:4200** (or **app.otom8.us**) **`/authenticate`**, then the flow builder.

## Where to edit what

- **Clerk UI branding (site + in-app widgets):**  
  `otom8-site/site/src/lib/clerk-appearance.ts` **and** `ap/packages/web/src/lib/otom8-clerk-appearance.ts` (keep in sync).
- **SSO route:** `otom8-site/site/src/app/api/ap-sso/route.ts`
- **AP shell (sidebar user, account settings):** `ap/packages/web/src/app/components/sidebar/`, `account-settings/`
