# kwtSMS

Send Arabic and English SMS with [kwtSMS](https://www.kwtsms.com), the Kuwait SMS gateway.

## Connection

Use your kwtSMS **API** username and password (from the API page in your account), not your website login. The connection is checked with `POST /API/balance/`.

## Actions

| Action | Endpoint | Notes |
| --- | --- | --- |
| Send SMS | `/API/send/` | Sender ID dropdown from `/API/senderid/`. Test Mode is on by default (`test=1`: queued, never delivered). Up to 200 numbers per request, larger lists are batched. |
| Get Balance | `/API/balance/` | Available and purchased credits. |
| Validate Numbers | `/API/validate/` | Returns `ok`, `er` (bad format) and `nr` (no route) lists. |
| Message Status | `/API/status/` | Queue status for a `msg-id`. Not a delivery report. |

Numbers are cleaned before sending: Arabic-Indic and Persian digits become Latin, `+`, `00`, spaces and other non-digits are removed, duplicates are dropped. Messages have emoji, hidden characters and HTML tags removed.

Errors show the kwtSMS code and description, for example `ERR003: Wrong username or password.`

Placeholder number format: `965XXXXXXXX`.
