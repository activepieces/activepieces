# @activepieces/cli

## Usage

```bash
npx @activepieces/cli <command>
```

### benchmark

Creates a flow (webhook trigger → data mapper → return response), publishes it, then load-tests
its synchronous webhook endpoint with [autocannon](https://github.com/mcollina/autocannon).
Defaults target a local dev environment.

Authenticate with an API key/token **or** email + password (no sign-up):

```bash
# API key or user token (Bearer) — project must be given explicitly
AP_API_KEY=<key> npx @activepieces/cli benchmark --project-id <id> --requests 500 --concurrency 10

# or email/password login — project is resolved automatically
npx @activepieces/cli benchmark --email you@dev.local --password '…' --requests 500 --concurrency 10
```

| Option | Default | Description |
|---|---|---|
| `--url` | `http://localhost:3000` | Activepieces base URL (dev env API port) |
| `--requests` | `500` | Total requests to fire |
| `--concurrency` | `10` | Concurrent connections |
| `--api-key` | `AP_API_KEY` env | Platform API key or user token (Bearer); requires `--project-id` |
| `--project-id` | | Project to create the flow in (required with `--api-key`) |
| `--email` / `--password` | | Login instead of an API key; resolves the project automatically |
| `--body` | `{"test":true}` | JSON body sent to the webhook |
| `--json` | | Machine-readable output |

## Building

Run `turbo run build --filter=@activepieces/cli` to build the library.

The publishable, self-contained bundle is produced by `npm run build-publish` (bundles workspace
deps with esbuild into `dist/`) and published via the **Release CLI** GitHub workflow.
