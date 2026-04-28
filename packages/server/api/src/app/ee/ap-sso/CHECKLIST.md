# AP-SSO Pre-Deploy Checklist

Before shipping any auth or SSO change:

## 1. Clerk key pair alignment (CRITICAL)
The `CLERK_SECRET_KEY` on the AP server **must** be the secret key for the exact same Clerk
application as the publishable key baked into the Docker image.
Mismatched keys = `jwk-kid-mismatch` → infinite login loop on every sign-in after signout.

How to verify:
```bash
# On the droplet — check which Clerk instance the server trusts:
ssh root@134.199.220.255 "docker compose -f /opt/ap/docker-compose.yml exec -T app printenv CLERK_SECRET_KEY"
# Must be sk_live_* from the same Clerk app as pk_live_Y2xlcmsub3RvbTgudXMk

# Confirm no kid-mismatch errors in recent logs:
ssh root@134.199.220.255 "docker compose -f /opt/ap/docker-compose.yml logs --tail=200 app | grep kid"
```

## 2. How the prod Clerk key is selected (important — read this)
The publishable key in the browser bundle is chosen in `packages/web/src/main.tsx`:
```ts
const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_DEPLOY_ENV === 'prod'
    ? 'pk_live_Y2xlcmsub3RvbTgudXMk'          // hardcoded prod key (reliable)
    : (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_*...');  // dev fallback
```
`VITE_DEPLOY_ENV=prod` is a literal in the CI workflow (not a secret) and reliably bakes into
the bundle. The `CLERK_PUBLISHABLE_KEY` GitHub secret is kept as belt-and-suspenders but is
NOT the primary mechanism — `docker/build-push-action` proved to silently drop secret values
through the ARG→ENV→Vite chain.

**If you ever change the prod Clerk application:** update the hardcoded `pk_live_*` in
`main.tsx` AND update `CLERK_SECRET_KEY` in the droplet's docker-compose env.

## 3. Verify the correct key is in the deployed bundle
```bash
ssh root@134.199.220.255 "docker compose -f /opt/ap/docker-compose.yml exec -T app sh -c \
  'grep -oa \"pk_test_[A-Za-z0-9]*\|pk_live_[A-Za-z0-9]*\" \
  /usr/src/app/dist/packages/web/assets/index-*.js | grep -v \"^pk_live_$\|^pk_test_$\"'"
# Should show ONLY pk_live_Y2xlcmsub3RvbTgudXMk (no pk_test_* full key)
```

## 4. afterSignOutUrl and logout
`packages/web/src/main.tsx` → `<ClerkProvider afterSignOutUrl="/login">`.
Logout calls `signOut({ redirectUrl: '/login' })` — explicit redirectUrl is required in Clerk v5
(without it, navigation can be silently skipped when instance state is inconsistent).
If you change the pk/sk pair you MUST test: sign in → sign out → sign in again.

## 5. Smoke test after every deploy
1. Open app.otom8.us in an incognito window
2. Sign in → verify you land on /flows
3. Sign out → verify you land on /login without a refresh loop
4. Sign in again → verify you land on /flows
5. Check logs: `ssh root@134.199.220.255 "docker compose -f /opt/ap/docker-compose.yml logs --tail=100 app | grep ap-sso"` — should be zero errors
