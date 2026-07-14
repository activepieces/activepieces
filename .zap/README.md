# DAST (Dynamic Application Security Testing)

OWASP ZAP scans the running **staging** deployment for runtime vulnerabilities (injection,
XSS, header/TLS misconfig, exposed surfaces, auth gaps). It complements the static container
scan (Grype, `.github/actions/sbom/`).

- Workflow: [`.github/workflows/dast.yml`](../.github/workflows/dast.yml)
- Scan plan: [`dast-plan.yaml`](./dast-plan.yaml) (ZAP Automation Framework)

## What it does

1. Signs in to `https://stg.activepieces.com` with a dedicated throwaway account and obtains a
   USER JWT.
2. Runs ZAP via the official `ghcr.io/zaproxy/zaproxy:stable` image, injecting
   `Authorization: Bearer <jwt>` on every request through a global `replacer` rule.
3. The Automation Framework plan imports the public OpenAPI spec (`/api/v1/docs`), spiders the
   SPA + API (traditional + AJAX), then runs a **full active** injection scan.
4. Emits a SARIF report → GitHub **Security → Code scanning**, and an HTML report kept as a
   30-day workflow artifact.

Runs nightly at **03:00 UTC** (inside the staging deploy freeze window, so no deploy races the
scan) and on demand via `workflow_dispatch`. **Non-blocking** for now — findings are surfaced,
the build is never failed.

## Blast radius & the safety denylist

Active scanning sends real attack payloads. Two things keep the damage contained:

1. **USER-scoped JWT** — authorization limits any created/modified/deleted data to the throwaway
   account's own project.
2. **`excludePaths` in `dast-plan.yaml`** — a safety denylist for endpoints whose side effects
   reach *other people or external services*, excluded even under full-active:
   - `/api/v1/otp`, `/api/v1/authn/local` — password-reset / verification **emails**
   - `/api/v1/user-invitations` — invitation **emails**
   - `/api/v1/stripe-billing` — payment provider **webhook**
   - `/ingest` — PostHog reverse-proxy (open passthrough)
   - `/api/v1/admin` — platform-admin surface (separate admin secret; unreachable with a USER JWT)

   To scan these anyway, remove the corresponding line — but understand the side effect first.

## Setup (one-time)

1. Create a throwaway account on staging (its own platform/project → natural containment).
2. Add repository secrets `DAST_STG_EMAIL` and `DAST_STG_PASSWORD` for that account.
3. Trigger the workflow via **Actions → DAST (ZAP) — Staging → Run workflow** to validate before
   relying on the nightly schedule.

## Tuning false positives

Add `alertFilter` entries in `dast-plan.yaml` (by ZAP `ruleId`) to downgrade or hide known
non-issues as the findings baseline is triaged.

