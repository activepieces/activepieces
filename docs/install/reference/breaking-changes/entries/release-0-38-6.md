---
id: release-0-38-6
title: "0.38.6"
added: '2025-12-10'
release: 0.38.6
legacy: true
---

### What has changed?

- Workers no longer rely on the `AP_FLOW_WORKER_CONCURRENCY` and `AP_SCHEDULED_WORKER_CONCURRENCY` environment variables. These values are now retrieved from the app server.

### When is action necessary?

- If `AP_CONTAINER_TYPE` is set to `WORKER` on the worker machine, and `AP_SCHEDULED_WORKER_CONCURRENCY` or `AP_FLOW_WORKER_CONCURRENCY` are set to zero on the app server, workers will stop processing the queues. To fix this, check the [Separate Worker from App](https://www.activepieces.com/docs/install/configure-operate/separate-workers) documentation and set the `AP_CONTAINER_TYPE` to fetch the necessary values from the app server. If no container type is set on the worker machine, this is not a breaking change.
