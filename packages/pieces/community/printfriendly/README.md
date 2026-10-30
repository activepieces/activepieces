# PrintFriendly

Convert web pages, HTML, or Markdown into clean PDF, Word, Markdown, HTML, JSON, or plain text documents.

## Authentication

PrintFriendly uses an API key:

1. Sign in at <https://www.printfriendly.com/login> or create a free account.
2. Open <https://www.printfriendly.com/me/api-key>.
3. Copy the key and paste it into the connection.

The free plan includes 100 documents per month, and a successful conversion consumes one document. `GET /v2/usage` is free and never consumes a document.

## Actions

| Action | Description |
| --- | --- |
| Convert to Document | Convert a web page, HTML, or Markdown into PDF, DOCX, Markdown, HTML, JSON, or plain text. |
| Read Page as Markdown | Fetch a public page and return its main article as clean Markdown. |
| Get Job | Retrieve the status and result of a background conversion. |
| Custom API Call | Send a request to `https://api.printfriendly.com` with the connection's key. |

## Notes

- PDF and DOCX results return a `file_url`; Markdown, HTML, and text return `content`; JSON returns the article as structured fields.
- Background conversions return a `job_id`; use Get Job to poll until `status` is `succeeded` or `failed`.
- File links and jobs expire after 48 hours.

## Triggers

None.
