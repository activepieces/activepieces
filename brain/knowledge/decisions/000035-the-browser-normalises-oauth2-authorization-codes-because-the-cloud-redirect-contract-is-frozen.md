---
status: accepted
---

# The browser normalises OAuth2 authorization codes, because the cloud redirect contract is frozen

## Decision

`getCode` decodes the posted authorization code **conditionally**, keyed on the connection type rather than on the message origin. `oauth2-utils` owns the pairing: one function takes the connection type plus the platform redirect flag and returns the redirect URL together with whether that page posts a percent-encoded code, so the URL and its decoding contract cannot drift apart again. A code that fails `decodeURIComponent` falls back to the raw string instead of throwing inside the listener. The sender check tightens from `redirectUrl.startsWith(event.origin)` to an exact origin comparison, since the same function now branches on who the sender is.

Deliberately out of scope: the `+` to space corruption in `redirect.tsx`, the abandoned-popup hang, and the vestigial `/api/redirect` page.

## Context

Two redirect pages are live and they disagree. `redirect.tsx` decodes once through `URLSearchParams`; `secrets.activepieces.com/redirect`, which every `CLOUD_OAUTH2` connect uses and which is not in this repo, posts the raw query value. `getCode` then applied one unconditional decode to both. `CLOUD_OAUTH2` therefore landed on exactly one decode and was correct, while `OAUTH2` and `PLATFORM_OAUTH2` double-decoded and corrupted any code containing a literal `%`. The split is by connection type, not by deployment: both kinds occur on Cloud and on self-hosted instances alike. Reproduced end to end on 2026-09-08 with a stub provider: issued `k1%2Fk2`, the token endpoint received `k1/k2`.

## Why

The obvious repair, deleting the decode, was tried in #14879 and reverted 21 hours later in #14926 because it broke every managed OAuth app, on self-hosted instances as much as on Cloud. `CLOUD_OAUTH2` means "uses an Activepieces-managed OAuth app", not "runs on Cloud": the managed app list is fetched whenever `platform.cloudAuthEnabled` is set, which is the default for every platform, so a self-hoster who has not registered their own OAuth app for a piece is on that path too. The regression also fired far more readily than the bug it fixed, because a raw posted code breaks on any `/`, `+` or `=`, which base64 codes are full of, while the double decode needs a literal `%`. A Google code starts `4/0A`, so Gmail stopped connecting at once. The obvious alternative, making the secrets service decode, is not available either: one deployment of that page answers every Activepieces version ever released, all of which decode in the browser, so a server-side decode would double-decode for the whole installed base. An additive versioned endpoint was considered and rejected, because it buys a second permanent contract and a second deploy while old builds stay on the old path, all to avoid a small branch in the browser. That leaves the client as the only place that can know which contract applies, and the connection type as the only trustworthy signal, since the origin is attacker influenced.

The mirror risk is accepted: a provider that double encodes its redirect is currently propped up by the bug and will break. Such a provider violates RFC 6749 and already fails against curl, Postman and standard OAuth libraries, the blast radius is one self-hoster's own custom app rather than the managed path that #14879 broke, and it fails loudly at connect time.

## Consequences

- The browser permanently owns code normalisation. Nobody should plan a fix that depends on `secrets.activepieces.com` changing behaviour.
- Tests must model **both** sender contracts, with the cloud rows asserted green before and after any change. #14879 shipped three tests that CI really ran, and they still missed the regression because all three modelled `redirect.tsx` only.
- The cloud contract is pinned as a fixture dated 2026-09-08, not a live network check, so CI does not depend on an external service. The verification method is recorded on *Testing OAuth2 Connects Locally*.
- Left open and still real: `+` becomes a space on `redirect.tsx` and on the `qs` parser behind `/api/redirect`; `getCode` never rejects or times out when a popup is abandoned; `/api/redirect` is unreferenced but may have external callers.
