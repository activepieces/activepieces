import { AppConnectionValueForAuthProperty, Store } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../auth';
import { NinjaPipeRecord, ninjapipeClient } from '../common/client';

function readTimestamp({ record, field }: { record: NinjaPipeRecord; field: TimestampField }): number | undefined {
  const value = record[field];
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

async function toPollItems({
  records,
  field,
  store,
  lastFetchEpochMS,
}: {
  records: NinjaPipeRecord[];
  field: TimestampField;
  store: Store;
  lastFetchEpochMS: number;
}): Promise<{ epochMilliSeconds: number; data: unknown }[]> {
  const timed = records.flatMap((record) => {
    const ms = readTimestamp({ record, field });
    return ms === undefined ? [] : [{ epochMilliSeconds: ms, data: record }];
  });
  const untimed = records.filter((record) => readTimestamp({ record, field }) === undefined && record['id'] !== undefined);
  if (untimed.length === 0) return timed;
  const seen = (await store.get<string[]>(UNTIMED_STORE_KEY)) ?? [];
  const fresh = untimed.filter((record) => !seen.includes(String(record['id'])));
  if (fresh.length === 0) return timed;
  const updatedSeen = [...seen, ...fresh.map((record) => String(record['id']))].slice(-UNTIMED_MAX_IDS);
  await store.put(UNTIMED_STORE_KEY, updatedSeen);
  const emitAt = Math.max(lastFetchEpochMS + 1, 1);
  return [...timed, ...fresh.map((record) => ({ epochMilliSeconds: emitAt, data: record }))];
}

async function fetchSince({
  auth,
  path,
  field,
  lastFetchEpochMS,
}: {
  auth: AppConnectionValueForAuthProperty<typeof ninjapipeAuth>;
  path: string;
  field: TimestampField;
  lastFetchEpochMS: number;
}): Promise<NinjaPipeRecord[]> {
  const client = ninjapipeClient.readAuth(auth);
  const isTest = lastFetchEpochMS === 0;
  const maxPages = isTest ? 1 : POLL_MAX_PAGES;
  const records: NinjaPipeRecord[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const result = await ninjapipeClient.listPage({
      auth: client,
      path,
      query: { sort_by: field, sort_order: 'desc' },
      page,
      limit: isTest ? TEST_PAGE_SIZE : 100,
      operation: 'poll for changes',
    });
    records.push(...result.items);
    const timestamps = result.items.map((record) => readTimestamp({ record, field })).filter((ms): ms is number => ms !== undefined);
    const reachedCheckpoint = timestamps.length > 0 && timestamps.reduce((min, ms) => (ms < min ? ms : min)) <= lastFetchEpochMS;
    if (!result.hasMore || reachedCheckpoint || result.items.length === 0) break;
  }
  return records;
}

function buildPolling({ path, field }: { path: string; field: TimestampField }): Polling<AppConnectionValueForAuthProperty<typeof ninjapipeAuth>, Record<string, never>> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, store, lastFetchEpochMS }) => {
      const records = await fetchSince({ auth, path, field, lastFetchEpochMS });
      return toPollItems({ records, field, store, lastFetchEpochMS });
    },
  };
}

function buildProjectTasksPolling({ field }: { field: TimestampField }): Polling<AppConnectionValueForAuthProperty<typeof ninjapipeAuth>, { projectId: string }> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, store, propsValue, lastFetchEpochMS }) => {
      const body = await ninjapipeClient.ninjapipeRequest({
        auth: ninjapipeClient.readAuth(auth),
        method: HttpMethod.GET,
        path: `/projects/${ninjapipeClient.pathId({ value: propsValue.projectId, field: 'Project' })}/tasks`,
        query: { sort_by: field, sort_order: 'desc' },
        operation: 'poll for task changes',
      });
      const records = ninjapipeClient.readItems(body);
      const sorted = [...records].sort((a, b) => (readTimestamp({ record: b, field }) ?? 0) - (readTimestamp({ record: a, field }) ?? 0));
      const items = await toPollItems({ records: lastFetchEpochMS === 0 ? sorted.slice(0, TEST_PAGE_SIZE) : sorted, field, store, lastFetchEpochMS });
      return items;
    },
  };
}

const POLL_MAX_PAGES = 10;
const TEST_PAGE_SIZE = 5;
const UNTIMED_STORE_KEY = 'ninjapipe_untimed_seen_ids';
const UNTIMED_MAX_IDS = 500;

export const ninjapipePolling = { buildPolling, buildProjectTasksPolling, toPollItems, POLL_MAX_PAGES };

type TimestampField = 'created_at' | 'updated_at';
