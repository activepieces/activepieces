---
id: release-0-80-0
title: "0.80.0"
added: '2026-03-09'
release: 0.80.0
legacy: true
---

### What has changed?

#### Infrastructure
- A new environment variable `AP_MAX_WEBHOOK_PAYLOAD_SIZE_MB` has been introduced to control the maximum allowed webhook payload size. The default is `25` MB. Webhooks exceeding this limit will be rejected with a `413 Request Too Long` response.
- Nginx has been removed from the Docker image. Fastify now serves both the API and the React frontend directly. All API routes are now under the `/api` prefix natively. If you were using `/v1/health` as a health check endpoint (e.g. in Kubernetes probes or load balancer checks), update it to `/api/v1/health`.
- Secret managers has been refactored, the version in **0.79.0** no longer is supported, it was not used by anyone but it's worth to mention to upgrade to **0.80.0** before considering using the feature

#### API
- A new `UPDATE_SAMPLE_DATA_INFO` flow operation has been introduced to handle sample data updates independently.
- `UPDATE_ACTION` and `UPDATE_TRIGGER` no longer accept or apply changes to `sampleData` in step settings. Any `sampleData` fields sent in these requests will be ignored and the existing sample data will be preserved.
- A new required `lastUpdatedDate` field has been added to all actions and triggers, tracked automatically by the server. It is not accepted in `UPDATE_ACTION` or `UPDATE_TRIGGER` requests.


### Do you need to take action?
- If you want to restrict webhook payload sizes below the new `25` MB default, set `AP_MAX_WEBHOOK_PAYLOAD_SIZE_MB` to your desired limit.
- If you are using the API to update sample data on steps via `UPDATE_ACTION` or `UPDATE_TRIGGER`, switch to the new `UPDATE_SAMPLE_DATA_INFO` operation instead.
- If you have custom health checks pointing to `/v1/health`, update them to `/api/v1/health`.
