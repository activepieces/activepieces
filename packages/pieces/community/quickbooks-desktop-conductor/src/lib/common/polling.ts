import { HttpMethod } from '@activepieces/pieces-common';
import { conductorClient, ConductorAuth } from './client';

type ConductorListResponse<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

// Conductor's `updatedAfter` is documented INCLUSIVE ("updated on or after this date/time",
// confirmed live 2026-08-20 against the invoices and receive-payments list docs) — the boundary
// record from the previous poll is deliberately re-fetched here. `pollingHelper`'s own TIMEBASED
// dedupe then filters it back out with a strict `epochMilliSeconds > lastFetchEpochMS` (see
// packages/pieces/common/src/lib/polling/index.ts), so this pairing is what makes TIMEBASED safe
// against off-by-one at the boundary — an EXCLUSIVE filter here would risk permanently dropping a
// record whose write becomes visible a moment after the previous poll already ran.
//
// Residual, framework-inherent limitation (not solved here): two DIFFERENT records that happen to
// share the exact same updatedAt second — QBD's granularity, confirmed live — where only one was
// visible at query time, will collide on that shared epoch. The one that arrives in a later poll
// is indistinguishable from "already emitted" and is silently dropped. This is a known trade-off
// of pollingHelper's TIMEBASED strategy (epoch-only dedupe, no per-item id tiebreaker) shared by
// every piece using it at this granularity, not something specific to this piece to route around
// with a bespoke cursor — the ticket scopes "TIMEBASED dedupe" explicitly. Flagged in both
// triggers' descriptions so a flow builder knows the (narrow) exposure exists.
//
// Second, unrelated Conductor/QBD platform quirk found and fixed here (confirmed live 2026-08-20):
// an `updatedAfter` value near the Unix epoch — including epoch-zero itself and even one
// millisecond after it — silently returns an empty result set, even though matching data exists
// (verified by fetching the exact same invoices through Query Transactions' `transactionDateFrom`
// filter instead). Binary-searched the boundary live: `1970-01-01T00:00:00.001Z` fails,
// `1970-03-01T00:00:00.000Z` succeeds — somewhere in Jan/Feb 1970, not documented anywhere.
// This isn't hypothetical: `pollingHelper.test()` (TIMEBASED's "Test trigger" path in the flow
// builder) always calls `items()` with `lastFetchEpochMS: 0`, i.e. exactly the epoch value that
// breaks — every fresh polling trigger's preview would silently show "no results" despite real
// data existing, with no error to explain why. `MIN_SAFE_UPDATED_AFTER_MS` clamps any
// suspiciously-old epoch up to a floor comfortably clear of the observed boundary. This never
// changes real production polling (`onEnable` always seeds a real `Date.now()` checkpoint, and a
// legitimate `lastFetchEpochMS` is never anywhere near 1980) — it only fixes the one call site
// that legitimately passes epoch-zero.
const MIN_SAFE_UPDATED_AFTER_MS = Date.parse('1980-01-01T00:00:00.000Z');

export async function fetchAllUpdatedSince<T>({
  auth,
  resourceUri,
  updatedAfterEpochMS,
}: {
  auth: ConductorAuth;
  resourceUri: string;
  updatedAfterEpochMS: number;
}): Promise<T[]> {
  const safeEpochMS = Math.max(updatedAfterEpochMS, MIN_SAFE_UPDATED_AFTER_MS);
  const updatedAfter = new Date(safeEpochMS).toISOString();
  return fetchPage({ auth, resourceUri, updatedAfter, cursor: undefined, itemsSoFar: [] });
}

async function fetchPage<T>({
  auth,
  resourceUri,
  updatedAfter,
  cursor,
  itemsSoFar,
}: {
  auth: ConductorAuth;
  resourceUri: string;
  updatedAfter: string;
  cursor: string | undefined;
  itemsSoFar: T[];
}): Promise<T[]> {
  const response = await conductorClient.request<ConductorListResponse<T>>({
    auth,
    method: HttpMethod.GET,
    resourceUri,
    queryParams: {
      updatedAfter,
      limit: '150',
      ...(cursor ? { cursor } : {}),
    },
  });
  const items = [...itemsSoFar, ...response.data];
  if (!response.hasMore || !response.nextCursor) {
    return items;
  }
  return fetchPage({ auth, resourceUri, updatedAfter, cursor: response.nextCursor, itemsSoFar: items });
}
