---
status: accepted
---

# A failed fetch is reported in place, never as a toast

## Decision
When a query for a page's primary data fails, the surface that would have shown the rows shows `DataFetchErrorState` instead — a calm placeholder naming the entity, saying the data is safe, offering Try again. Nothing global fires: `QueryCache.onError` in `app/query-client.ts` only `console.error`s, and query `meta` carries no error flag at all.

## Context
This surface has now been rebuilt three times against the same customer report — a failed fetch reading as deleted data. First a blocking modal with the raw JSON payload (`meta.showErrorDialog`), which turned a 404 from an EE-only route into a wall of technical text. Then a global toast keyed on `meta.errorToastEntity`, which named what failed but still left the empty table sitting behind it. Both were page-independent, so React Query's three retries landed them seconds later on whatever page the user had moved to.

## Why
An empty table is the actual bug, and only the table can fix it. Once every list renders its own placeholder, a toast is either a second notification for one failure or — when it fires alone — an explanation floating next to an unexplained blank. Rejected: keeping the toast but firing it only when the query still holds cached data, so the two could never appear together. It is the more precise design and it covers a real gap (React Query keeps rendering stale rows after a failed refetch, and no placeholder can appear in that state), but it keeps a whole subsystem — meta typing, a `WeakSet` dedupe, an `isActive()` guard, an entity noun threaded through every query — alive to serve one case, and the team chose the smaller surface.

## Consequences
A silently-stale list is the accepted cost: if a refetch fails while data is cached, the rows stay and nothing says they are old. Losing the meta flag also removed the only marker a lint rule could have keyed on, so enforcement moved to the type system instead: `isError` and `errorStateEntity` are **required** props on `DataTable`, and the compiler refuses any table that has not decided. That is deliberately stronger than a lint rule — it fires while the component is being written, and it immediately surfaced four tables that had silently gone without an error state. A table whose rows are already-loaded props rather than its own query answers `isError={false}`, which is a statement rather than an omission. Hand-written lists (automations, agents, the AI Center tabs, the platform MCP page, the embed subdomain steps, the health runs tab) have no equivalent guard and rely on review until a `QueryBoundary` wrapper exists.

On one of those, forgetting the placeholder now fails silently and actively misleads: with no toast left, a failed query leaves `data` undefined, the component falls through to its *empty* state, and the app tells the user "No connections found" — an affirmative claim that their data is gone, which is the exact illusion this decision exists to prevent. The only remaining signal is the Sentry report from `QueryCache.onError`, and that is Cloud-only: `errorReporting` initialises from the `FRONTEND_SENTRY_DSN` flag, so on a self-hosted instance the report sits in a buffer that never flushes and the failure is invisible end to end.
