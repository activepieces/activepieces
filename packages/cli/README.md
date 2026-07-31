# @activepieces/cli

## Usage

```bash
npx @activepieces/cli <command>
```

### benchmark

Creates a flow (webhook trigger → data mapper → return response), publishes it, then load-tests
its synchronous webhook endpoint with [autocannon](https://github.com/mcollina/autocannon).
Defaults target a local dev environment.

Authenticate with a platform-admin API key. The CLI provisions a throwaway project for the run
(with a high concurrency cap so a project rate limiter can't skew the numbers) and deletes it after:

```bash
AP_API_KEY=<key> npx @activepieces/cli benchmark --url https://your-instance.example.com
```

| Option | Default | Description |
|---|---|---|
| `--url` | `http://localhost:3000` | Activepieces base URL (dev env API port) |
| `--requests` | `40 × concurrency` | Total requests to fire |
| `--concurrency` | auto = execution slots | Concurrent connections |
| `--api-key` | `AP_API_KEY` env | Platform-admin API key (Bearer) |
| `--body` | `{"test":true}` | JSON body sent to the webhook |
| `--json` | | Machine-readable output |

## Building

Run `turbo run build --filter=@activepieces/cli` to build the library.

The publishable, self-contained bundle is produced by `npm run build-publish` (bundles workspace
deps with esbuild into `dist/`) and published via the **Release CLI** GitHub workflow.
