---
id: background-migrations-need-a-dedicated-postgres-role-when-a
title: "Background migrations need a dedicated Postgres role when a `statement_timeout` applies"
added: '2026-10-18'
release: 0.93.0
---

This release adds background migrations for slow backfills, `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY`. They run on the app's database connection. If that connection has a `statement_timeout`, Postgres cancels these statements at the cap and they never finish.

#### What you need to do

Nothing if `SHOW statement_timeout;` returns `0` on the app's connection (the Postgres default). Otherwise, create a role without a timeout:

```sql
CREATE ROLE ap_migrator WITH LOGIN PASSWORD '<generated>';
ALTER  ROLE ap_migrator SET  statement_timeout = 0;
GRANT  <app_role> TO ap_migrator;
```

`<app_role>` is the role `AP_POSTGRES_URL` connects as. Then set `AP_POSTGRES_MIGRATION_URL=postgres://ap_migrator:<password>@<host>:<port>/<database>` on the API. Behind a connection pooler, give this role its own small pool (size 3) and use that pool's URL. `SET statement_timeout = 0` from the app does not work behind a transaction pooler.
