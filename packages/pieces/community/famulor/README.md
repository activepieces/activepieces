# pieces-famulor

Famulor Platform 2.0 community piece (`@activepieces/piece-famulor`). Talks only to REST API v1.

- Default host: `https://app.famulor.io` → `https://app.famulor.io/api/v1`
- Optional Base URL for verified whitelabel domains (same `/api/v1` paths)
- Auth: `Authorization: Bearer fam_…`
- Call-completed trigger verifies `X-Famulor-Signature: sha256=<hmac>` over the raw body

Classic 1.0 (`https://app.famulor.de/`, `/api/user/*`) is not supported.

`logoUrl` stays `https://cdn.activepieces.com/pieces/famulor.png`. The 512×512 PNG in this folder (`famulor.png`) is the current Famulor brand mark (cyan rounded square + toggle) and should replace the old serif-F asset on the CDN.

## Building

Run `turbo run build --filter=@activepieces/piece-famulor` to build the library.
