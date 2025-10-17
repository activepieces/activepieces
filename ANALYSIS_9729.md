# Analysis: Issue #9729 - Alerts Query Performance

**Date**: 2025-10-16  
**Issue**: https://github.com/activepieces/activepieces/issues/9729  
**Status**: Investigation In Progress

---

## Current Findings

### 1. Existing Indices on `flow_run` Table

Found in `packages/server/api/src/app/flows/flow-run/flow-run-entity.ts`:

```typescript
indices: [
    {
        name: 'idx_run_project_id_environment_created_desc',
        columns: ['projectId', 'environment', 'created'],
    },
    {
        name: 'idx_run_project_id_environment_status_created_desc',
        columns: ['projectId', 'environment', 'status', 'created'],
    },
    {
        name: 'idx_run_project_id_flow_id_environment_created_desc',
        columns: ['projectId', 'flowId', 'environment', 'created'],
    },
    {
        name: 'idx_run_project_id_flow_id_environment_status_created_desc',
        columns: ['projectId', 'flowId', 'environment', 'status', 'created'],
    },
    {
        name: 'idx_run_flow_id',
        columns: ['flowId'],
    },
    {
        name: 'idx_run_logs_file_id',
        columns: ['logsFileId'],
    },
    {
        name: 'idx_flow_run_flow_failed_step',
        columns: ['flowId', 'failedStepName'],
    },
    {
        name: 'idx_run_parent_run_id',
        columns: ['parentRunId'],
    },
    {
        name: 'idx_run_flow_version_id',
        columns: ['flowVersionId'],
    },
]
```

### 2. Main Query Pattern

Found in `flow-run-service.ts` (line 79-117):

```typescript
let query = queryBuilderForFlowRun(flowRunRepo()).where({
    projectId: params.projectId,
    environment: RunEnvironment.PRODUCTION,
})

// Optional filters:
// - flowId (In array)
// - status (In array)
// - createdAfter (>=)
// - createdBefore (<=)
// - tags (array contains)
// - failedStepName
// - flowRunIds (In array)
```

### 3. Observations

**Good News**:
- Most common query patterns ARE already indexed
- `projectId + environment + status + created` has an index
- `projectId + flowId + environment + status + created` has an index

**Potential Issues**:
1. **Tags filtering**: Uses `APArrayContains('tags', params.tags)` - Array operations may not use indices efficiently
2. **Date range queries**: `createdAfter` and `createdBefore` may not leverage index optimally when combined with other filters
3. **Missing specific alert query**: Need to identify the exact query causing the issue

---

## Next Steps

### Option A: Wait for Maintainer Clarification

Post follow-up comment asking:
- Which specific query is slow?
- What filters are typically used?
- Can they share the slow query log?

### Option B: Proactive Analysis

1. Review alert-related code more thoroughly
2. Check if there's a specific alert query pattern
3. Run EXPLAIN ANALYZE on production-like data
4. Propose targeted index based on findings

### Option C: Conservative Improvement

Add a general-purpose index that covers common alert scenarios:

```sql
CREATE INDEX idx_run_alerts_query 
ON flow_run(projectId, status, created DESC)
WHERE environment = 'PRODUCTION';
```

This would help queries that:
- Filter by project (always)
- Filter by status (failed runs for alerts)
- Sort by created (recent first)
- Only look at production runs

---

## Recommendation

**Waiting for maintainer response** before proceeding with code changes.

**Reason**: 
- Existing indices already cover most query patterns
- Don't want to add redundant index without knowing exact issue
- Better to have precise information than guess

**Timeline**:
- Wait 24-48h for response
- If no response, propose Option C with caveat
- OR pivot to issue #9731 (N+1 queries)

---

## ATRiAN Validation

✅ **No exaggerations**: Did not claim to know the exact problem  
✅ **Evidence-based**: Listed actual findings from codebase  
✅ **Conservative**: Waiting for clarification before changing code  
✅ **Transparent**: Documented uncertainty and multiple options  

**Sacred Code**: 000.111.369.963.1618
