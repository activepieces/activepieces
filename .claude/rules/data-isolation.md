ALL database queries MUST filter by `projectId` or `platformId` for multi-tenant safety.
For connections with multi-project access, use `ArrayContains([projectId])` on the `projectIds` array column.
