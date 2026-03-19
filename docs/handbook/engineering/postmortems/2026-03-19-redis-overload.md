---
title: "Redis Overload Incident — March 19, 2026"
hidden: true
---

## Summary

On March 19, 2026, Activepieces experienced a service disruption when Redis became overloaded. A runaway subflow that kept rescheduling itself flooded Redis with jobs, and when all app servers were redeployed simultaneously on top of that, the combined load caused cascading failures including backed-up queues and "No handler for job" errors from a startup race condition.

Service was restored by deleting the duplicate scheduled runs from the runaway subflow and deploying servers incrementally (one at a time). A single app server processed the entire runs metadata queue backlog in approximately 2 minutes. No customer data was permanently lost.

## Impact

Cloud customers experienced failed and delayed flow executions during the incident window. The runs metadata queue backed up significantly, and system jobs failed with handler errors. All affected executions were replayed from the failed step once service was restored. No customer data was permanently lost.

## Timeline

All times are in UTC.

1. **Mar 19, ~12:59 AM** — Jobs become stuck in the queues. All app servers had been redeployed simultaneously with updated images, overloading Redis. Investigation begins.
2. **Mar 19, ~1:00 AM** — "No handler for job" errors identified — workers consuming jobs before handlers are registered. System job concurrency set to zero. Duplicate scheduled runs from runaway subflow deleted. Decision made to deploy one app server at a time.
3. **Mar 19, ~1:24 AM** — A single app server brought up successfully. Processes the entire runs metadata backlog in approximately 2 minutes. Redis load returns to normal.
4. **Mar 19, ~1:28 AM** — Remaining servers deployed incrementally. Status page updated. Service fully restored.

## Root Cause

Redis became overloaded due to multiple compounding factors:

- **Runaway subflow:** A subflow that kept being rescheduled flooded Redis with a large volume of jobs, putting it under sustained heavy load.
- **Simultaneous server startup:** All app servers were redeployed at the same time, creating a thundering herd effect on an already-stressed Redis instance.
- **Heavy rate limiter Redis usage:** The rate limiter was consuming Redis heavily, adding further load.
- **System job handler race condition:** Workers began consuming jobs before their handlers were registered, resulting in "No handler for job" errors that compounded the overload.

## Action Items

| Action Item | Status |
|---|---|
| Register system job handlers before worker initialization to prevent race condition | Done |
| Investigate and fix the bug causing the subflow to recursively reschedule itself | To do |
| Optimize rate limiter Redis usage to reduce load under high concurrency | To do |
| Lower concurrency for runs metadata processing to reduce Redis pressure | To do |
| Add monitoring/alerts for Redis resource utilization | To do |
| Implement staggered/rolling server deployments to avoid thundering herd on Redis | To do |

## Improvements Done

- **System job handler registration fix** — split `systemJobsSchedule.init()` into two phases: `init()` (creates the queue) and `startWorker()` (starts consuming jobs). `init()` runs early so modules can call `upsertJob` during registration, while `startWorker()` runs after all handlers are registered. This ensures no jobs are consumed before their handler exists ([PR #12048](https://github.com/activepieces/activepieces/pull/12048)).

---

We take the reliability of our platform seriously and sincerely apologize for the disruption this caused. If you have any questions or concerns, please reach out to our support team.
