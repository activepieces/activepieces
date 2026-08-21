import { HttpMethod } from '@activepieces/pieces-common';
import { conductorClient, ConductorAuth } from './client';

type ConductorListResponse<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

// Conductor's `updatedAfter` filter is inclusive, so we deliberately re-fetch the record that set
// the last checkpoint — pollingHelper's own strict `epochMilliSeconds > lastFetchEpochMS` filters
// it back out. That pairing is what keeps TIMEBASED safe at the boundary; an exclusive filter here
// could drop a record whose write lands just after the previous poll already ran.
//
// One gap that doesn't fix: two different records sharing the same second, where one only becomes
// visible in a later poll, collide on that epoch and the late one gets silently dropped. That's a
// limitation of pollingHelper's TIMEBASED strategy itself, not worth a bespoke cursor here — noted
// in both triggers' descriptions instead.
//
// Separate issue: an `updatedAfter` near the Unix epoch silently returns nothing even when
// matching data exists. `pollingHelper.test()` always polls from epoch zero, so every trigger's
// first test in the builder would otherwise show "no results" with nothing pointing at why.
// Clamping below never affects real polling, since a legitimate checkpoint is never this old.
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
