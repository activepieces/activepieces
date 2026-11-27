---
id: webhook-payloads-over-25-mb-are-rejected
title: "Webhook payloads over 25 MB are rejected"
added: '2026-03-09'
order: 1
release: 0.80.0
---

A new environment variable `AP_MAX_WEBHOOK_PAYLOAD_SIZE_MB` has been introduced to control the maximum allowed webhook payload size. The default is `25` MB. Webhooks exceeding this limit will be rejected with a `413 Request Too Long` response.

#### What you need to do

If you want to restrict webhook payload sizes below the new `25` MB default, set `AP_MAX_WEBHOOK_PAYLOAD_SIZE_MB` to your desired limit.
