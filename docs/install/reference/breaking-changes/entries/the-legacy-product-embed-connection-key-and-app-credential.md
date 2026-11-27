---
id: the-legacy-product-embed-connection-key-and-app-credential
title: "The legacy product-embed connection-key and app-credential endpoints are removed"
added: '2026-09-10'
release: 0.91.0
---

The original product-embed flow is gone. It let a host application store per-project OAuth client credentials and a public key, then mint an app connection by presenting a token signed with the matching private key. These endpoints are removed:

- `GET`, `POST` and `DELETE` `/v1/connection-keys/app-connections`
- `GET`, `POST` and `DELETE` `/v1/connection-keys`
- `GET`, `POST` and `DELETE` `/v1/app-credentials`

They were registered on the Cloud edition only, so a self-hosted installation never served them, on either Community or Enterprise. The user interface that drove them was removed several releases ago and no SDK or documented flow referenced them. They now return `404`.

The current embedding stack is unaffected: signing keys, managed authentication, JWT user provisioning and the embed SDK are a separate feature and continue to work unchanged.

#### What you need to do

Nothing for a self-hosted installation, and no environment variable or migration. The `app_credential` and `connection_key` tables are left in place by this release and are simply no longer read; a later release drops them.

If you call one of the endpoints above against Activepieces Cloud, move to the current embedding flow, which provisions users and connections through a platform signing key. See [Embedding](/embedding/overview).
