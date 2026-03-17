---
title: "Infrastructure Upgrade Incident — March 16–17, 2026"
hidden: true
---

# Infrastructure Upgrade Incident — March 16–17, 2026

## Summary

On March 16–17, 2026, Activepieces experienced a service disruption lasting approximately 12–24 hours (with the first ~6 hours being the most severe) after rolling out a new worker architecture on Kubernetes. This infrastructure change was made to improve the stability and scalability of Activepieces. Two cascading issues — a persistent volume provisioning problem and a dedicated worker misconfiguration — caused flow execution failures for most cloud customers and one enterprise customer.

## Impact

### Cloud customers (Issue 1)

Most cloud customers experienced failed or delayed flow executions over a ~12–24 hour period, with the first ~6 hours having the most severe impact. Some executions were lost during this window, but all affected executions were replayed from the failed step once service was restored.

### Enterprise customer (Issue 2)

One enterprise customer with a dedicated worker had flows fail because npm was blocked after a trust level misconfiguration during the namespace migration. All affected executions were replayed from the failed step once the issue was resolved.

## Timeline

All times are in UTC.

**Mar 14–15 (Pre-incident):** As part of our infrastructure upgrade, we moved enterprise dedicated workers to their own Kubernetes namespaces to isolate them from shared infrastructure changes. We then began rolling out the new architecture for shared workers.

1. **Mar 16, 8:13 PM** — Shared workers begin failing after the architecture refactor deployment is applied.
2. **Mar 16, 8:50 PM** — Brief recovery observed.
3. **Mar 16, 8:52 PM** — Errors resurface shortly after the brief recovery.
4. **Mar 17, 3:26 AM** — Root cause identified: persistent volumes (PVCs) filled up with no way to fix them in-place and no shell access to debug. Decision made to revert to the previous deployment method (Kamal) with multi-tenant workers.
5. **Mar 17, 8:13 AM** — Discovered a separate issue: one enterprise customer's dedicated worker had been misconfigured with the wrong trust level during the namespace migration, causing npm to be blocked in their sandbox environment.
6. **Mar 17, 11:30 AM** — Trust level configuration fixed, full rollout completed, and all failed executions replayed from their failed step.

## Root Causes

### Issue 1: Persistent volume provisioning on Kubernetes

The Kubernetes persistent volumes (PVCs) allocated to the new shared workers filled up quickly after deployment. Once full, there was no shell access available to diagnose or remediate the issue. Additionally, no rollback plan had been prepared for the Kubernetes deployment, which delayed recovery.

### Issue 2: Enterprise dedicated worker trust level misconfiguration

When moving enterprise dedicated workers to the new server, a code change accidentally set `trustedEnvironment` to `false` for one enterprise customer. This disabled npm package support in the sandbox, causing that customer's flows to fail. This code path had no test coverage at the time, so the misconfiguration went undetected until flows started failing.

## What Went Well

1. **Enterprise worker isolation was completed ahead of rollout.** Dedicated workers were moved to their own namespaces 1–2 days before the shared worker migration, which limited the blast radius and prevented the PVC issue from affecting enterprise customers directly.
2. **Execution replay from failed step.** The platform's ability to replay failed executions from the exact step that failed meant no customer data was permanently lost, despite the extended outage.
3. **Smoke tests for trusted environments already existed in worker v2.** The new worker architecture already included smoke tests that validate sandbox npm access for trusted environments, which helped catch Issue 2 quickly once it was discovered.
4. **Gradual dedicated worker migration was already built into worker v2.** Per-customer validation when migrating dedicated workers was already implemented, reducing future risk.
5. **Quick identification of the revert path.** Once the PVC root cause was identified, the team made a clear decision to revert to Kamal rather than continue debugging the Kubernetes deployment, which accelerated recovery.
6. **Team responded and stayed engaged through the night.** The incident spanned overnight hours (8 PM – 11:30 AM UTC), and the team maintained continuous investigation and response throughout.

## What Went Wrong

1. **No rollback plan for the Kubernetes deployment.** The migration to Kubernetes was deployed without a documented or tested rollback strategy. When PVCs filled up, there was no fast path back, delaying recovery by several hours.
3. **PVC sizing was not validated under production load.** Persistent volumes were provisioned without load-testing against real production traffic patterns, causing them to fill up unexpectedly fast.
5. **Trust level configuration had no test coverage.** The code path that set `trustedEnvironment` for dedicated workers was not covered by tests, allowing a misconfiguration to ship undetected.
6. **No canary deployment strategy.** The new architecture was rolled out to all shared workers at once rather than incrementally, so there was no opportunity to catch issues on a small subset before full impact.
7. **Issue 2 was discovered late.** The enterprise worker misconfiguration was not found until ~12 hours after the initial incident began, because investigation was focused on the PVC issue affecting shared workers.

## What We Did

When shared workers started failing at 8:13 PM on March 16, the team immediately began investigating. Over the next several hours, we observed brief recoveries followed by recurring errors, which pointed to a resource issue rather than a code bug.

By 3:26 AM on March 17, we identified the root cause: the Kubernetes persistent volumes had filled up, and with no shell access to the worker pods, there was no way to fix the issue in-place. Rather than continue debugging the Kubernetes setup, we made the decision to revert. This was not a simple rollback — reverting to Kamal required significant code changes to re-adapt the worker architecture back to the previous multi-tenant deployment model. Once those changes were made and deployed, flow execution was restored for cloud customers.

With shared workers back online, we turned our attention to enterprise dedicated workers at 8:13 AM. We discovered that one enterprise customer's dedicated worker had `trustedEnvironment` incorrectly set to `false` after the namespace migration, which was blocking npm libraries in the code piece in their sandbox. We corrected the configuration and added test coverage for this code path to prevent similar code misconfigurations in the future.

By 11:30 AM, all systems were fully operational. We then identified every execution that had failed during the incident window for both cloud and enterprise customers and replayed each one from the exact step that failed. No customer data or automation results were permanently lost.

## Action Items

| Action Item | Status |
|---|---|
| Implement a documented and tested rollback plan for all infrastructure migrations | To do |
| Add test coverage for worker trust level and sandbox configuration | Done |
|  Support canary deployments  To do |

## Improvements Since the Incident

Following this incident, we invested heavily in test coverage and stability improvements to prevent similar issues and catch misconfigurations before they reach production:

- **Worker trust level and sandbox configuration tests** — added dedicated tests covering the `trustedEnvironment` code path that caused Issue 2, ensuring configuration changes are validated automatically.
- **Worker polling resilience tests** — tests covering job execution lifecycle, resilience to invalid job data, null polls, unrecognized job types, and mixed valid/invalid sequences.
- **Sandbox execution tests** — tests for sandbox creation, startup, RPC communication, resource cleanup on timeout or memory issues, and process cleanup.
- **Race condition tests for queue dispatcher** — 12 tests covering orphaned job handling, double-loop spawn prevention during close, single dequeue concurrency control, and waiter timeout/retry behavior.
- **Subflow resume race condition tests** — 8 tests covering the race where the engine writes pause metadata to Redis before it's persisted to DB, verifying Redis fallback when DB is stale.
- **Rate limiter concurrency tests** — tests for concurrent job slot allocation, idempotency with concurrent dispatch, and per-project isolation.
- **End-to-end smoke tests in CI** — GitHub Actions workflows that validate health checks and webhook flow execution on both AMD64 and ARM64.
- **Benchmark tests in CI** — load testing across 6 app/worker configurations measuring throughput, mean latency, P50, and P99.

These improvements give us significantly higher confidence in future infrastructure changes and reduce the risk of undetected misconfigurations.

---

We take the reliability of our platform seriously and sincerely apologize for the disruption this caused. If you have any questions or concerns, please reach out to our support team.
