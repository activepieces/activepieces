---
icon: 🧪
---

# Reproduce a Self-Hoster's Proxy Topology

How to stand up a self-hoster's real deployment shape locally — a reverse proxy, a second hostname, a path
prefix, a real SAML IdP — so a redirect or discovery bug can be measured instead of argued about. Unit tests
cannot catch these: the interesting failures live in what the *proxy* forwards and what the *browser* does with
the URL AP hands it. Everything below runs on one machine with no `/etc/hosts` edit and no DNS.

## Steps

1. **Get real hostnames for free.** `*.127.0.0.1.nip.io` resolves to loopback publicly, so
   `ap.127.0.0.1.nip.io`, `mcp.127.0.0.1.nip.io` and `idp.127.0.0.1.nip.io` are distinct hosts and distinct
   browser *origins* (which matters — `localStorage`/`sessionStorage` are per-origin, and that is exactly what
   the MCP consent redirect is about). No sudo, and Chrome reaches them.
2. **Put Kong 3.9 in front, DB-less.** `KONG_DATABASE=off` + a declarative `kong.yml`, published on `:80`,
   upstream `http://host.docker.internal:<port>` with `extra_hosts: host.docker.internal:host-gateway`. Kong's
   defaults are the realistic case: it rewrites `Host` to the upstream and sets `X-Forwarded-Host` to the public
   host, which is the branch `networkUtils.candidateHosts` prefers. Use `strip_path: true` for a prefix route —
   AP registers its routes at the root and expects the proxy to strip.
3. **Run AP in production mode, not dev.** `AP_ENVIRONMENT=prod` is what makes the API serve the built SPA from
   `dist/packages/web`; in dev it serves no frontend and the whole browser half is untestable. Build once with
   `npx turbo run build --filter=web`, then run the API from source with
   `npx tsx --tsconfig packages/server/api/tsconfig.app.json packages/server/api/src/bootstrap.ts` — the
   `--tsconfig` is required or workspace imports resolve to unbuilt `dist` paths. EE also rejects
   `AP_EXECUTION_MODE=UNSANDBOXED`, so pass `SANDBOX_CODE_ONLY`.
4. **Isolate the state.** A separate Postgres database and a separate Redis port, never the dev ones — BullMQ
   keys and platform rows collide otherwise, and you will be changing `AP_FRONTEND_URL` repeatedly.
5. **Use `kristophjunge/test-saml-idp` as a real IdP.** Mount your own `saml20-sp-remote.php` (SP entity ID is
   the literal `Activepieces`, ACS is `<AP_FRONTEND_URL>/api/v1/authn/saml/acs`) and your own `authsources.php`
   — the stock image sends only `uid`/`email`, and `resolveSamlAttributes` also requires `firstName` and
   `lastName`. Give the IdP route `preserve_host: true` so SimpleSAMLphp derives its own URLs from the public
   host; paste its metadata XML into `idpMetadata` inline, because a URL there goes through `safeHttp` and the
   SSRF filter rejects loopback.
6. **Unblock the EE gates by hand** — they are orthogonal to what you are testing, and each one is a dead end
   otherwise: `platform_plan.ssoEnabled = true`, `platform_plan.usersLimit` above 1 (free plan is 1 seat, and
   the invite 402s), `platform.ssoDomainVerification` set to `{"status":"VERIFIED",…}` (SAML config is refused
   until the domain is verified, and you cannot create the TXT record), and the SSO user's invitation must be
   **accepted**, not pending — `assertUserIsInvitedToPlatformOrProject` calls `hasAnyAcceptedInvitations`.
   Re-apply these after every restart: the plan row is recomputed at boot and silently reverts to 1 seat with
   SSO off.
7. **Drive SAML headlessly when you need the XML.** `curl -L` the login route to get the IdP form, POST
   `username`/`password`/`AuthState` back, and scrape `SAMLResponse` from the auto-submit page — that gives you
   a decodable assertion and a replayable POST to `/acs`. Switch to a real browser for anything involving
   `sessionStorage` or SPA routing, which is most redirect bugs.
8. **Finish in a browser, or you have not tested it.** curl proves what the server *advertises*; only the
   browser proves the flow *completes*. Run the whole chain — protocol `401`, discovery, DCR, `/authorize`,
   the IdP credential form, consent, the code landing on a local callback server, the token exchange, and one
   real `tools/call` — and check the callback actually received a code. A configuration can pass every curl
   assertion and still issue no code, which is how the prefixed-frontend shape in [[mcp-server]] was caught.
9. **Measure both branches on the same harness.** Kill the app, `git checkout` the other commit, restart with
   identical env, re-run the same request. A before/after pair of `Location` headers settles a redirect
   question in one command, and is how the SSO landing regression in [[ee-authentication-sso-rbac]] was found.

## Gotchas

- **`sed -i` on a bind-mounted single file breaks the mount.** It writes a new inode, and the container then
  fails to restart with `error mounting … no such file or directory`. Either truncate in place (`cat > file`)
  or edit and `docker compose up -d --force-recreate <svc>` — never `restart`.
- **Force-recreating the IdP is also how you get its login form back.** SimpleSAMLphp keeps a session, so a
  second run silently auto-authenticates and you stop exercising the credential step.
- **A prefix route in the proxy is not an exact route.** `paths: [/mcp]` also matches `/mcp-authorize`; see
  [[mcp-server]].
- **The harness lives in a scratch directory, so treat it as disposable and commit code changes early.** A
  `/tmp` wipe or host restart takes the worktree, the Kong and IdP configs, and any generated SP keypair with
  it; only the Postgres volume survives.
- **The SPA cannot be tested under a path prefix**, because it is anchored to the origin root three ways — see
  [[web-feature-anatomy]]. Opening a prefixed URL makes the app relocate itself to the root. If you are testing
  a browser landing route, the prefix is the variable, so run the configuration both ways.

## Key files

- `packages/server/api/src/app/helper` — `domainHelper` and `networkUtils`, what every advertised URL is built from
- `packages/server/api/src/app/ee/authentication/saml-authn` — `createSamlClient`, the SP settings the IdP must match
