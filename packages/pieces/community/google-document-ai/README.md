# Google Document AI

Extract text, entities, form fields and tables from documents (PDF, images, Office files) with
[Google Document AI](https://cloud.google.com/document-ai) processors: OCR, Form Parser,
Invoice and Expense parsers, Layout Parser and Custom Extractors.

## Connection

Both connection types use your own Google Cloud project. Every action accepts either one.

- **Service Account (Recommended)**: paste the JSON key file of a service account with the
  **Document AI API User** role (`roles/documentai.apiUser`) and the processors' location. The
  connection is checked on creation by listing the processors of the project and location.
- **Google Account (OAuth2)**: bring your own OAuth client (scope
  `https://www.googleapis.com/auth/cloud-platform`), then fill in the project ID and the location.

Prerequisites: the **Cloud Document AI API** and **billing** enabled on the project (Document AI
charges per page), and at least one processor created in the console. Document AI is regional:
requests go to `https://{location}-documentai.googleapis.com`, so the location of the connection
(`us`, `eu`, ...) must match where the processors live.

## Actions

- **Process Document**: online processing of one file from the flow or a `gs://` Cloud Storage
  URI. Online processing accepts up to 15 pages (30 with Imageless Mode, on by default); use
  **Pages** (for example `1,3-5`) to stay under the limit. The output has the same shape for every
  processor type: `text`, `mimeType`, `pageCount`, `languages`, `entities`, `formFields` and
  `tables`. Turn on **Include Full Document** to also get the raw Document AI `document`.
- **Custom API Call**: any Document AI REST endpoint on the connection's regional host (paths
  include `/v1`), for example `batchProcess` for longer documents, operations and processor
  management.
