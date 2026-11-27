---
id: ap-max-concurrent-jobs-per-project-is-renamed-and-its
title: "`AP_MAX_CONCURRENT_JOBS_PER_PROJECT` is renamed and its default drops to 5"
added: '2026-04-07'
order: 2
release: 0.82.0
---

`AP_MAX_CONCURRENT_JOBS_PER_PROJECT` → `AP_DEFAULT_CONCURRENT_JOBS_LIMIT`. Default drops from `100` to `5`.

#### What you need to do

Rename `AP_MAX_CONCURRENT_JOBS_PER_PROJECT` to `AP_DEFAULT_CONCURRENT_JOBS_LIMIT`. To keep the old cap, set `AP_DEFAULT_CONCURRENT_JOBS_LIMIT=100`.
