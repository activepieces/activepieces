---
id: sample-data-is-updated-with-update-sample-data-info
title: "Sample data is updated with `UPDATE_SAMPLE_DATA_INFO`"
added: '2026-03-09'
order: 4
release: 0.80.0
---

- A new `UPDATE_SAMPLE_DATA_INFO` flow operation has been introduced to handle sample data updates independently.
- `UPDATE_ACTION` and `UPDATE_TRIGGER` no longer accept or apply changes to `sampleData` in step settings. Any `sampleData` fields sent in these requests will be ignored and the existing sample data will be preserved.

#### What you need to do

If you are using the API to update sample data on steps via `UPDATE_ACTION` or `UPDATE_TRIGGER`, switch to the new `UPDATE_SAMPLE_DATA_INFO` operation instead.
