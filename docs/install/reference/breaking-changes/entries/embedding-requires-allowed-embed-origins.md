---
id: embedding-requires-allowed-embed-origins
title: "Embedding requires allowed embed origins"
added: '2026-05-12'
order: 2
release: 0.84.0
---

Embedding now requires setting allowed embed origins, which means only the domains listed in the field can embed the app (wildcards are supported). There is also a new env variable `AP_ALLOWED_EMBED_ORIGINS` for setting pre-allowed origins, and a new endpoint for adding these origins — [check docs](/endpoints/embedding/add-allowed-embed-origins).

#### What you need to do

If you are embedding your self-hosted activepieces somewhere make sure it's on the allow list.
