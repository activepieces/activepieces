# Plunk

Activepieces piece for [Plunk](https://useplunk.com), an open-source email platform for transactional and marketing email built on AWS SES.

## Authentication

Plunk uses two API keys, both available from your project's API settings:

- **Secret API key** (`sk_*`) — required. Used by every action except Track Event.
- **Public API key** (`pk_*`) — optional. Required only by the Track Event action, because the Plunk `/v1/track` endpoint accepts public keys only.

## Actions

- **Send Transactional Email** — `POST /v1/send`
- **Track Event** — `POST /v1/track`
- **Get All Contacts** — `GET /v1/contacts`
- **Get Contact** — `GET /v1/contacts/{id}`
- **Custom API Call** — call any Plunk endpoint with the secret key
