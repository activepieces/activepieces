---
id: the-container-no-longer-bundles-pm2-crashes-exit-the
title: "The container no longer bundles PM2 — crashes exit the container"
added: '2026-08-13'
release: 0.88.2
---

The Docker image used to run the app and worker under PM2, which restarted a crashed process *inside* the container. PM2 is removed; the entrypoint now launches the processes with plain `node`. When a process crashes (or is OOM-killed), the container exits instead of silently recycling the process in place, and your orchestrator restarts it.

#### What you need to do

Nothing if you deploy with Docker Compose, Kubernetes/Helm, or any orchestrator that already restarts failed containers (all official deployments do). If you run the image with a bare `docker run` and relied on PM2 to keep the container alive across process crashes, add a restart policy: `docker run --restart unless-stopped ...`.
