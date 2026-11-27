---
id: enforcing-same-version-of-docker-image-on-both-worker-and
title: "Enforcing same version of docker image on both worker and app servers"
added: '2026-06-17'
order: 3
release: 0.85.4
---

Previously if your worker was on a different version of your app server, the worker would work fine most of the time, but because some changes we do will require both of them to be on the same version we added this safeguard.
