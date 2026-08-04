# pieces-drop-to-cdn

Community piece for [Drop to CDN](https://droptocdn.com) — upload files and get instant public CDN URLs.

## Building

Run `turbo run build --filter=@activepieces/piece-drop-to-cdn` to build the library.

## Actions

| Action | API |
|--------|-----|
| Upload File | `POST /v1/files` |
| Get File Information | `GET /v1/files/:id` |
| Delete File | `DELETE /v1/files/:id` |

Auth: Bearer API key (`dtc_...`), validated via `GET /v1/profile`.
