# web

## What this codebase does

React SPA for Activepieces: the flow builder, runs dashboard, connections,
pieces directory, and project/platform admin surfaces. Vite-built. Talks
to `server-api` over REST. Embeds inside customer apps via the EE embed
SDK (`packages/ee/embed-sdk`), which uses `postMessage` for cross-origin
control. White-labelable per platform.

## Auth shape

- **Token storage**: JWT held in browser memory + a long-lived refresh
  via the API. Access tokens MUST NOT be persisted to `localStorage` /
  `sessionStorage` / `IndexedDB` / cookies that are not `HttpOnly`.
- **Per-route gating**: feature/edition gates are declared via
  `LockedFeatureGuard` and `enabled: platform.plan.<flag>` on
  `useQuery`. A route that should be EE-only but renders
  unconditionally on CE is a bug.
- **Embed SDK origin check**: the embed bootstrap validates the parent
  origin against the platform's allow-list before responding to any
  `postMessage`. A handler that acts on `event.data` without checking
  `event.origin` is a finding.

## Threat model

DOM XSS in the flow builder (which renders user-authored content like
step names, descriptions, and webhook samples) is the biggest concern.
Second is **token exfiltration** via a leaky storage choice or a third-
party iframe. Third is **CSRF / origin confusion** via the embed SDK's
`postMessage` channel, which lets the embedder drive sign-in and flow
mutations.

## Project-specific patterns to flag

- **`dangerouslySetInnerHTML` outside vetted markdown renderers.** The
  flow builder renders user-authored strings (step names, sample data,
  pieces metadata). Any `dangerouslySetInnerHTML` on a user-sourced
  string without a sanitizer (DOMPurify or equivalent) is XSS.
- **`window.postMessage` / `addEventListener('message', ...)` without
  origin check.** The embed SDK requires `event.origin ===` against an
  allow-list. A handler that uses `event.data` first and checks origin
  later (or never) is a real CSRF.
- **Auth-token persisted to `localStorage` / `sessionStorage`.** JWTs
  belong in memory; only the opaque refresh token may be persisted, and
  only via the helper that knows about the platform's storage policy.
- **`useQuery` for primary page data missing `meta: { showErrorDialog:
  true }`.** The global `QueryCache.onError` in `app.tsx` shows an error
  dialog when this flag is set; queries that back a table/list page need
  it. (Project-specific UX rule, not a vulnerability, but a real bug.)
- **Hardcoded brand strings** ("Activepieces", brand colors, logo paths)
  in customer-facing surfaces — UI must use platform appearance from
  `platform.plan.customAppearanceEnabled`, not constants.

## Known false-positives

- Dev-only tooling (`/storybook`, `__mocks__`, fixture files, test
  utilities under `src/**/__tests__/`) is not customer-facing.
  `dangerouslySetInnerHTML` in a Storybook story is fine.
- The markdown renderer used for pieces' README content already
  sanitizes (it's the project's vetted renderer). Don't flag
  `dangerouslySetInnerHTML` inside that component.
- The embed SDK demo page intentionally registers a permissive message
  listener for local development.

## Editions

CE renders the default theme. EE applies `platform.plan.customAppearanceEnabled`
branding. Cloud always applies platform branding. Any branding constant
that doesn't read from `platform.plan` is a customer-visible white-label
leak.
