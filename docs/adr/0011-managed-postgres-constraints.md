# Target managed PostgreSQL: no custom extensions, sanitize external data

The schema must run on managed PostgreSQL offerings, so we do not rely on custom database extensions, and all externally-sourced data is passed through `sanitizeObjectForPostgresql()` before persistence. We accept this constraint (rather than using extensions like `pg_trgm` or storing raw payloads) so self-hosted and Cloud deployments run on the same unmodified managed database; external data can contain null bytes and other byte sequences Postgres rejects, which `sanitizeObjectForPostgresql()` strips.
