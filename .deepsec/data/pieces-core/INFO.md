# pieces-core

## What this codebase does

27 officially maintained Activepieces utility pieces — `http`, `pdf`, `file-helper`,
`sftp`, `smtp`, `crypto`, `graphql`, `image-helper`, `csv`, `xml`, `qrcode`, the
data/text/math/date helpers, native features (`store`, `tables`, `webhook`,
`manual-trigger`, `subflows`), and control-flow pieces (`approval`, `delay`,
`schedule`, `forms`). All load into the engine's `pieceExecutor` with no privilege
difference from community pieces — the trust distinction is purely organizational
(Activepieces-maintained vs contributor-submitted).

## Auth shape

No auth surface inside pieces. Each piece receives `context.auth` (resolved
third-party credentials — OAuth tokens, API keys, basic-auth, custom-auth) and
`context.propsValue` (resolved user input). Credentials are issued + resolved by
the server before the piece runs; pieces consume them and forward to third-party
APIs.

## Threat model

Three concrete risks: (1) **SSRF via user-supplied URLs** in pieces that take a URL
as a property — `http`, `graphql`, `sftp`, `smtp`, `data-summarizer`, `tables`
(via internal API). Every one flows through `httpClient` from
`@activepieces/pieces-common`, which currently does NOT apply
`request-filtering-agent` and DOES globally disable TLS verification — see the
`pieces-common` briefing for root cause. (2) **Path traversal / zip-slip** in
`file-helper/src/lib/actions/unzip-file.ts` if `context.files.write()` doesn't
validate zip-entry filenames against `../` patterns. (3) **Subprocess hardening**
in `pdf/src/lib/actions/convert-to-image.ts`, which `child_process.exec`s
`/usr/bin/pdftoppm` against `tmpdir() + nanoid()` paths — currently safe, but any
regression that interpolates user input into the command string is RCE.

## Project-specific patterns to flag

- **`fetch(...)` / `axios.create()` / `http.request` inside a piece action.** All
  outbound HTTP from a piece MUST go through `httpClient` from
  `@activepieces/pieces-common`. A direct fetch/axios skips even the SDK-level
  layer — and when `pieces-common` eventually adds proper SSRF filtering, the
  direct callsite remains a bypass.
- **`child_process.exec` / `spawn` with a string-interpolated command.** The
  `pdf` piece is the only current subprocess user. New subprocess calls anywhere
  in core are a finding unless argv is constant and inputs flow via stdin or
  files.
- **Zip-slip / path traversal.** Any `path.join(baseDir, userInput)` followed by
  `fs.writeFile` / `fs.createWriteStream` without `resolve(...).startsWith(baseDir)`.
  Spec target: `file-helper/src/lib/actions/unzip-file.ts`.
- **`eval` / `new Function` / `vm.runInContext`.** None currently exist in core
  pieces; any introduction is a finding. User-supplied code execution belongs in
  `server-engine`'s sandbox, not in a piece.
- **`context.auth` or `context.propsValue` logged verbatim.** Both contain
  third-party secrets. `console.log(propsValue)` or `logger.info({ auth })` leaks
  credentials to the engine's logs.

## Known false-positives

- `pdf/convert-to-image.ts` `exec()` is intentional and currently safe — the
  `pdftoppm` binary path is the constant `/usr/bin/pdftoppm`, and input/output
  paths come from `tmpdir() + nanoid()`. Don't flag this unless the argv shape
  changes.
- `httpClient.sendRequest(...)` against a user-supplied URL is flagged at the
  `pieces-common` level (the SDK is where the fix belongs), NOT at every callsite
  in `pieces-core`. Don't surface 20 duplicate SSRF findings — one per piece is
  the ceiling, and the architectural fix is in the SDK.
- `tables` piece talks to the internal Activepieces API at `context.server.apiUrl`
  with a short-lived engine token — that's internal traffic, not a third-party
  call.

## Editions

Core pieces load in all editions (CE/EE/Cloud). No `/ee/` subtree exists under
`packages/pieces/core/`; any `import … from "…/ee/…"` would be a layering bug.
