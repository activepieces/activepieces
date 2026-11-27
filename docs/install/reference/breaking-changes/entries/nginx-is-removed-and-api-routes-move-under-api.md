---
id: nginx-is-removed-and-api-routes-move-under-api
title: "Nginx is removed and API routes move under `/api`"
added: '2026-03-09'
order: 2
release: 0.80.0
---

Nginx has been removed from the Docker image. Fastify now serves both the API and the React frontend directly. All API routes are now under the `/api` prefix natively. If you were using `/v1/health` as a health check endpoint (e.g. in Kubernetes probes or load balancer checks), update it to `/api/v1/health`.

#### What you need to do

If you have custom health checks pointing to `/v1/health`, update them to `/api/v1/health`.
