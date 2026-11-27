---
id: actions-and-triggers-have-a-server-managed-lastupdateddate
title: "Actions and triggers have a server-managed `lastUpdatedDate`"
added: '2026-03-09'
order: 5
release: 0.80.0
---

A new required `lastUpdatedDate` field has been added to all actions and triggers, tracked automatically by the server. It is not accepted in `UPDATE_ACTION` or `UPDATE_TRIGGER` requests.
