---
id: worker-group-runs-no-longer-fall-back-to-shared-workers
title: "Worker group runs no longer fall back to shared workers"
added: '2026-09-13'
release: 0.91.0
---

Runs for a project assigned to a worker group used to fall back to the shared queue whenever the group had no online workers, so shared workers would execute them. Runs now always stay on the group's dedicated queue (`project-<group-name>-jobs`) and wait there until a worker carrying the matching `AP_WORKER_GROUP_ID` connects — shared workers never pick them up.

#### What you need to do

If you assign projects to worker groups, keep at least one worker online per assigned group. If a group is down, reassign the project to another group or unassign it (set its `workerGroupId` to `null`) — any assignment change moves the project's waiting runs to the new queue.
