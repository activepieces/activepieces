---
id: release-0-74-0
title: "0.74.0"
added: '2025-12-17'
release: 0.74.0
legacy: true
---

### What has changed?
- The default embedded database for development and lightweight deployments has changed from **SQLite3** to [**PGLite**](https://pglite.dev/) (embedded PostgreSQL).
- The environment variable `AP_DB_TYPE=SQLITE3` is now deprecated and replaced with `AP_DB_TYPE=PGLITE`.
- Existing SQLite databases will be automatically migrated to PGLite on first startup.
- Templates are broken in this version. A migration issue changed template IDs, breaking API endpoints. This will be fixed in the next patch release.
- The `aiCredits` feature per project has been removed. In the next version, it will be replaced by integration with the AI Gateway.

### Do you need to take action?
- **If you are using `AP_DB_TYPE=SQLITE3`:** Update your configuration to use `AP_DB_TYPE=PGLITE` instead.
- **If you are using templates:** Wait for the next patch release to fix the template IDs.
