---
id: table-record-filters-compare-date-columns-chronologically
title: "Table record filters compare date columns chronologically"
added: '2026-08-13'
release: 0.88.2
---

The `gt`, `gte`, `lt` and `lte` operators on `GET /v1/records` used to parse every cell value as a number. On a Date column that meant `2026-08-12T14:30:00Z` was read as `2026`, so two dates in the same year always compared equal and a range filter matched nothing. Those four operators now compare Date and Date & Time columns as instants.

This affects the Tables piece's Find Records action and any direct API call that filters a Date column with a range operator. `eq`, `neq` and `co` are unchanged and still compare the stored text exactly, so two spellings of the same instant (`...T14:30:00Z` and `...T14:30:00.000Z`) do not match each other.

#### What you need to do

Nothing on upgrade. Re-check any flow or API integration that filters a Date column with `gt`, `gte`, `lt` or `lte` — it now returns the rows the filter actually describes, which may be more or fewer than before.
