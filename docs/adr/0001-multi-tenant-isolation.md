# Multi-tenant isolation on every query

Activepieces is multi-tenant (Platform → Project → User), so every database query MUST filter by `projectId` or `platformId` — for connections with multi-project access, by `ArrayContains([projectId])` on the `projectIds` column. We enforce this at the query level rather than relying on a row-level-security layer because the same code paths serve Community, Enterprise, and Cloud editions; a missed filter is a cross-tenant data leak, which is why it is also a hard rule in `.claude/rules/data-isolation.md`.
