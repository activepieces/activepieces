# Aconex

Community piece for reading [Oracle Aconex](https://help.aconex.com/aconex/aconex-apis/) projects, mail, and documents. It is not an Oracle product and is not endorsed by Oracle. Each connection uses a User-Bound OAuth client that the customer registers. This package does not ship a client id or secret.

The logo URL is `https://cdn.activepieces.com/pieces/aconex.png`. That object may 404 until ActivePieces hosts it. This piece does not vendor an Oracle logo.

API terms: <https://www.oracle.com/a/ocom/docs/corporate/oracle-aconex-api-terms-110320.pdf>.

## Register a User-Bound client

Register the client in the Oracle Construction and Engineering Lobby as **User-Bound** (client credentials bound to the Lobby user who creates it). Web Server and Installed apps are a different product and are not what this connection asks for.

- Getting started: <https://help.aconex.com/apis/getting-started-with-apis/>
- Which OAuth integration to register: <https://help.aconex.com/apis/what-type-of-oauth-integration-should-i-register/>
- User-Bound token request: <https://help.aconex.com/apis/implement-smart-construction-platform-oauth/>

Paste the client id and client secret into the connection. The piece stores those values. It does not store the bearer token in the connection or in the trigger store. A bearer is minted at run time and kept in process memory until 60 seconds before `expires_in` (3600 seconds when Lobby omits it).

Early Access credentials are not production credentials. Register a second client for production.

## Lobby and user binding

| Lobby | When |
| --- | --- |
| `https://constructionandengineering.oraclecloud.com` | Commercial production. Default. |
| `https://constructionandengineering-ea.oraclecloud.com` | Early Access only. |

There is no free-text lobby host. AU Government Lobby is not offered. `https://au2.aconex.com` is not in the instance list.

Data calls always use `https://api.aconex.com/api`. The instance hostname is only `user_site` on the token request.

Leave **Aconex user id** and **Aconex instance** both empty when the Lobby user has one linked Aconex account. Set both when that user links to more than one account. The user id is digits only. The instance is an origin with no trailing slash.

Early Access `https://ea1.aconex.com` is valid only with the Early Access Lobby. A commercial instance is valid only with the production Lobby. The connection test rejects a mismatched pair, a half-set user id or instance, and a non-digit user id. It then mints a token and calls List Projects.

Guide for Early Access: <https://help.aconex.com/apis/integrate-with-the-early-access-environment/>.

Use an Aconex user whose project roles match the automation, not a personal admin login, if the flow can see confidential mail or documents. Step output can contain names and message bodies. Restrict the flow the same way the project is restricted.

## Actions

| Name | What it does |
| --- | --- |
| `list_projects` | `GET /api/projects`. Also the connection test. |
| `list_project_mail` | One inbox or sent page. Page size is a multiple of 25, at most 500, default 25. Search is optional Lucene. |
| `get_mail` | View one mail. Does **not** mark it read. |
| `list_documents` | One register page of current versions (`show_document_history=false`). |
| `get_document_metadata` | Always sends `sanitizeInvalidXmlCharacters=true`. |
| `download_document_file` | Primary file, or the marked-up PDF when Marked up is on. Optional `sizeForceFetch`. Stops above 500 MB. |
| `custom_api_call` | Path on `https://api.aconex.com/api` only. Not a full URL. |

`return_fields` values are query tokens, not response keys. The actions return the parsed XML names.

- Document version id is the attribute `@DocumentId`. `TrackingId` is the id that stays the same across versions.
- `docno` comes back as `DocumentNumber`, `doctype` as `DocumentType`, `registered` as `DateModified`, `author` as `Author` (that is the API name for the web field Created By).
- `get_mail` returns `MailData` for the body. `MailBody` is the create, forward, and register request field. This piece does not rename either of them to `body`, and it does not send mail.

Send, reply, forward, and register mail are not in this version. The create schema is per project and per mail type. A flow that must send mail can use `custom_api_call` with a body the operator supplies, or it can stay manual. A non-GET custom call can change data in Aconex.

## Triggers

| Name | What it does |
| --- | --- |
| `new_or_updated_mail` | Mail changed from a stored UTC hour forward. |
| `new_or_updated_document` | Document versions changed from that hour forward, including a new version of the same tracking id. Metadata only; the file is not downloaded. |

There is no Aconex webhook for these APIs, so both triggers use `TriggerStrategy.POLLING` and `pollingHelper` from `@activepieces/pieces-common`.

`everythingsince` is floored to a UTC hour and means **from that hour forward**, not that hour only. `items()` returns only the oldest 25 unseen rows, so `lastPoll` cannot jump to the newest row of an open delta. The stored hour advances only when every row in that hour is seen or abandoned (history from before the trigger was enabled, or a row whose metadata call failed). It never moves past the current UTC hour. A response over 20 MB fails the poll and does not move the hour.

Dedupe keys:

- Mail: `id` + `lastModifiedDate`
- Document: `DocumentId` + `lastModifiedDate` + `lastEventDate`

Integrity requests do not send `username` or `password`. The guides still list those query fields; the OAuth samples do not. Confirm the HTTP status against a real project before relying on a poll.

In this clone, `packages/pieces/common/src/lib/polling/index.ts` matches that cursor:

- `onEnable` receives `isRepublish` and does not overwrite `lastPoll` when republishing if `lastPoll` is already stored.
- `onDisable` does not delete store keys.
- `poll` sets `lastPoll` to the max `epochMilliSeconds` of the rows `items()` returned.

There is no backup cursor. You do not need to disable a flow before editing it.

The platform runs a polling trigger about every 5 minutes. This piece cannot make that interval slower. Each run is one integrity read plus at most 25 metadata reads, spaced by the throttle below. Two polling triggers on one project is a reasonable load. Many polling flows on the same Aconex organization share Oracle's limit and can receive HTTP 503.

## Throttle

Oracle's limit is 5 requests per second and 10 concurrent requests **per organization**. See <https://help.aconex.com/apis/aconex-web-services-performance-throttling/>.

This process keeps at most 4 requests in flight and at least 200 ms between starts. That queue does **not** cap the organization at 5 requests per second once another worker is also calling Aconex. On `CONCURRENCY_THROTTLE_LIMIT_REACHED`, `MAX_FREQUENCY_THROTTLE_LIMIT_REACHED`, and HTTP 429, the piece makes 1 try and 3 retries (waits of 200 ms, 400 ms, and 800 ms with full jitter). The fourth failure throws. A fifth request is not sent.

## Not implemented

Basic Auth and Integration IDs are not implemented. Oracle plans to retire Integration IDs toward the beginning of 2027, and Basic Auth returns HTTP 403 for SSO and 2-step accounts. Do not add a second auth method for them.

Mail attachment download and rendition secondary files are not implemented. Document download is the primary backing file only (or the marked-up PDF). It does not send `Accept-Encoding`. The call may redirect to `*.customer-oci.com`; this is the only Aconex call that follows redirects. Fetch removes `Authorization` on a cross-origin redirect. That behavior has not been checked against a live host.

## Logs and TLS

`HttpError` in this ActivePieces version logs the failed request body. A custom POST, PUT, PATCH, or DELETE body can therefore show up in the worker log. The client secret is not in that body. It is sent only as the Basic header on `POST {lobby}/auth/token`, and that header is not stored on `HttpError`. This piece never puts `error.message` (which stringifies the request body) into the connection error or the step output. Failures include the Aconex `ErrorCode` and `RequestID` when Aconex sent them.

This piece does not set `NODE_TLS_REJECT_UNAUTHORIZED`. `FetchHttpClient.sendRequest` in this repository still sets that variable itself. That is upstream behavior, not this piece.

XML is parsed with `fast-xml-parser` 5.10.1, `processEntities: false`, a DOCTYPE reject, and a 20 MB cap. Values stay strings so ids such as `271341877549172398` are not rounded.
