# @activepieces/piece-validatedmails

ValidatedMails is an email validation API integration for Activepieces that validates a single email address and returns a consistent, flat response contract suitable for routing, scoring, and downstream decision steps.

## Example workflow

1. Trigger on a new lead submission.
2. Run **ValidatedMails → Validate Email**.
3. Branch on `status` (`valid`, `invalid`, `unknown`) to continue, reject, or review the lead.

## Field guide

| Field | Type | Description |
|---|---|---|
| `is_valid` | boolean | Final validity decision. |
| `status` | string | High-level status (`valid`, `invalid`, `unknown`). |
| `score` | number | Confidence score returned by API. |
| `reason` | string | Primary reason label. |
| `state` | string | Provider state label. |
| `email` | string | Submitted email. |
| `normalized` | string | Normalized email string. |
| `domain` | string | Parsed domain part. |
| `free` | boolean | `true` for free-provider domains. |
| `role` | boolean | `true` for role-based mailboxes. |
| `disposable` | boolean | `true` for disposable domains. |
| `accept_all` | boolean | `true` when domain appears catch-all. |
| `tag` | boolean | `true` when plus-tagging is detected. |
| `smtp_ok` | boolean | SMTP signal outcome when available. |
| `syntax_ok` | boolean | Syntax validation result. |
| `mx_ok` | boolean | MX resolution result. |
| `a_ok` | boolean | A-record fallback result. |
| `response_ms` | number | End-to-end API latency in milliseconds. |
| `mx_record` | string \| undefined | Primary MX host when available. |
| `mx_hosts` | string[] | MX host list returned by API. |
| `reasons` | string[] | Detailed reason list. |
| `trace_id` | string | Request identifier for support. |

## Authentication

Create a ValidatedMails API key in your ValidatedMails dashboard and connect it as `API Key` in Activepieces. Connection validation calls `GET /api-keys/me`.

## Support

info@validatedmails.com
