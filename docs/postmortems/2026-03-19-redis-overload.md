---
title: "Redis Overload Incident — March 19, 2026"
hidden: true
---

## Summary

On March 19, 2026, Activepieces experienced a service disruption when Redis became overloaded. A runaway subflow that kept rescheduling itself flooded Redis with jobs, and when all app servers were redeployed simultaneously on top of that, the combined load caused cascading failures including backed-up queues and "No handler for job" errors from a startup race condition.

Service was restored by deleting the duplicate scheduled runs from the runaway subflow and deploying servers incrementally (one at a time). A single app server processed the entire backlog for runs metadata queue in approximately 2 minutes.

## Impact

Cloud customers experienced failed and delayed flow executions during the incident window. The runs metadata queue backed up significantly, and system jobs failed with handler errors. All affected executions were replayed from the failed step once service was restored. No customer data was permanently lost.

## Timeline

All times are in UTC.

1. **Mar 19, ~12:59 AM** — Jobs become stuck in the queues. All app servers had been redeployed simultaneously with updated images, overloading Redis. Investigation begins.
2. **Mar 19, ~1:00 AM** — System job handlers throwing "No handler for job" errors due to a race condition where workers consume jobs before handlers are registered. Runs metadata queue backs up. System job concurrency set to zero to stop the handler errors. Decision made to deploy one app server at a time instead of all at once.
3. **Mar 19, ~1:24 AM** — A single app server brought up successfully. It processes the entire runs metadata backlog in approximately 2 minutes. Redis load returns to normal.
4. **Mar 19, ~1:28 AM** — New app server images confirmed working. Remaining servers deployed incrementally. Status page updated. Service fully restored.

## Root Cause

Redis became overloaded due to multiple compounding factors:

- **Runaway subflow:** A subflow that kept rescheduling itself flooded Redis with a large volume of jobs, putting Redis under sustained heavy load.
- **Simultaneous server startup:** All app servers were redeployed at the same time, creating a thundering herd effect on an already-stressed Redis instance.
- **Heavy rate limiter Redis usage:** The rate limiter was consuming Redis heavily, adding significant load on top of the above.
- **System job handler race condition:** Workers began consuming jobs from the queue before their system job handlers (DELETE_FLOW, UPDATE_FLOW_STATUS, HARD_DELETE_PROJECT, HARD_DELETE_PLATFORM) were registered, resulting in "No handler for job" errors. This was caused by `systemJobsSchedule.init()` being called before `registerJobHandler` calls completed.

The combination of the runaway subflow, simultaneous server startup, Redis overload, and unhandled system jobs caused the runs metadata queue to back up, creating a cascading failure across the platform.

## What Went Well

1. **Fast recovery once the approach changed.** A single app server cleared the entire runs metadata backlog in just 2 minutes, demonstrating the system recovers quickly once Redis load is manageable.
2. **Quick pivot to incremental deployment.** Rather than continuing to debug the simultaneous deployment, the team quickly decided to deploy one server at a time, which resolved the issue.
3. **Team coordination through the night.** The team stayed engaged and communicated effectively through the early morning hours to resolve the incident.

## What Went Wrong

1. **Runaway subflow flooded Redis.** A subflow that kept rescheduling itself generated a large volume of jobs, putting Redis under sustained heavy load before the deployment even began.
2. **All servers redeployed simultaneously.** Deploying all app servers at once on top of an already-stressed Redis created a thundering herd effect. There was no staggered deployment strategy in place.
3. **System job handlers registered after worker initialization.** A race condition in the startup sequence meant workers could pick up jobs before handlers were registered, causing "No handler for job" errors that compounded the Redis overload.
4. **Rate limiter put excessive load on Redis.** The rate limiter's Redis usage pattern contributed significantly to the overload, particularly under high-concurrency conditions.

## What We Did

Redis was already under heavy load from a runaway subflow that kept rescheduling itself, flooding the queue with jobs. During a deployment of updated app server images on March 19, all servers were started simultaneously, which overwhelmed the already-stressed Redis instance further.

The Redis overload triggered a cascade: system job handlers threw "No handler for job" errors because workers started consuming jobs before handlers were registered, and the runs metadata queue backed up significantly.

To stabilize the system, we set system job concurrency to zero to stop the handler errors and deleted the duplicate scheduled runs created by the runaway subflow. We then switched to deploying one app server at a time. A single app server was brought up and processed the entire runs metadata backlog in approximately 2 minutes. We confirmed the new images were working correctly and completed the remaining deployment incrementally.

## Action Items

| Action Item | Status |
|---|---|
| Register system job handlers before worker initialization to prevent race condition | Done |
| Optimize rate limiter Redis usage to reduce load under high concurrency | To do |
| Lower concurrency for runs metadata processing to reduce Redis pressure | To do |
| Add monitoring/alerts for Redis resource utilization | To do |
| Implement staggered/rolling server deployments to avoid thundering herd on Redis | To do |

## Improvements Done

- **System job handler registration fix** — split `systemJobsSchedule.init()` into two phases: `init()` (creates the queue) and `startWorker()` (starts consuming jobs). `init()` runs early so modules can call `upsertJob` during registration, while `startWorker()` runs after all modules and edition-specific handlers are registered. This ensures no jobs are consumed before their handler exists, fixing the "No handler for job" errors that occurred when the BullMQ worker picked up queued Redis jobs before handlers were registered at startup ([PR #12048](https://github.com/activepieces/activepieces/pull/12048)).

---

We take the reliability of our platform seriously and sincerely apologize for the disruption this caused. If you have any questions or concerns, please reach out to our support team.
