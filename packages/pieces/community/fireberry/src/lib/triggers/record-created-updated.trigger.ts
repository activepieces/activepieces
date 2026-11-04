import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../auth';
import { objectTypeDropdown } from '../common/props';
import { FireberryClient, FIREBERRY_LIMITS } from '../common/client';

const CURSOR_KEY = 'fireberry_record_cursor';
const LEGACY_KEY = 'lastPollTime';
const CREATE_STAMP_TOLERANCE_MS = 2000;
const MAX_PAGES_PER_POLL = 100;
const MAX_RECORDS_IN_ONE_SECOND = 10_000;

function timestampField(triggerType: string | undefined): 'createdon' | 'modifiedon' {
  return triggerType === 'created' ? 'createdon' : 'modifiedon';
}

function compareTimestamps({ a, b }: { a: string; b: string }): number {
  const left = Date.parse(a);
  const right = Date.parse(b);
  if (Number.isNaN(left) || Number.isNaN(right)) {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  return left - right;
}

function toQueryTimestamp(timestamp: string): string {
  const match = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.exec(timestamp);
  if (!match) {
    throw new Error(`Unexpected Fireberry timestamp format '${timestamp}'; expected YYYY-MM-DDTHH:mm:ss.`);
  }
  return match[0];
}

function recordId({ record, primaryKey }: { record: Record<string, unknown>; primaryKey: string }): string {
  const id = primaryKey ? readString({ record, key: primaryKey }) : undefined;
  if (!id) {
    throw new Error(`Fireberry returned a record without its primary key '${primaryKey}'; cannot deduplicate trigger events.`);
  }
  return id;
}

function isFreshCreate({ createdon, modifiedon }: { createdon: string | undefined; modifiedon: string }): boolean {
  if (!createdon) {
    return false;
  }
  return Math.abs(compareTimestamps({ a: modifiedon, b: createdon })) <= CREATE_STAMP_TOLERANCE_MS;
}

function readString({ record, key }: { record: Record<string, unknown>; key: string }): string | undefined {
  const value = record[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

function selectNewRecords({
  records,
  cursor,
  field,
  primaryKey,
  triggerType,
}: {
  records: Record<string, unknown>[];
  cursor: RecordCursor | null;
  field: string;
  primaryKey: string;
  triggerType: string | undefined;
}): { items: Record<string, unknown>[]; cursor: RecordCursor | null } {
  const items: Record<string, unknown>[] = [];
  let nextTimestamp = cursor?.timestamp ?? null;
  let nextIds = new Set(cursor?.ids ?? []);
  const seen = new Set<string>();
  for (const record of records) {
    const timestamp = readString({ record, key: field });
    const id = recordId({ record, primaryKey });
    if (!timestamp) {
      continue;
    }
    const dedupeKey = `${id}|${timestamp}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    if (cursor?.timestamp) {
      const diff = compareTimestamps({ a: timestamp, b: cursor.timestamp });
      if (diff < 0 || (diff === 0 && cursor.ids.includes(id))) {
        continue;
      }
    }
    if (nextTimestamp === null || compareTimestamps({ a: timestamp, b: nextTimestamp }) > 0) {
      nextTimestamp = timestamp;
      nextIds = new Set([id]);
    } else if (compareTimestamps({ a: timestamp, b: nextTimestamp }) === 0) {
      nextIds.add(id);
    }
    if (triggerType === 'updated' && isFreshCreate({ createdon: readString({ record, key: 'createdon' }), modifiedon: timestamp })) {
      continue;
    }
    items.push(record);
  }
  return {
    items,
    cursor: nextTimestamp === null ? cursor : { timestamp: nextTimestamp, ids: [...nextIds] },
  };
}

function sameQuerySecond({ timestamp, since }: { timestamp: string | undefined; since: string }): boolean {
  return timestamp !== undefined && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.exec(timestamp)?.[0] === toQueryTimestamp(since);
}

// Fireberry filters to the second, so a burst of records inside the cursor's second always comes back
// from page 1. Normal reads stop after FIREBERRY_LIMITS.MAX_PAGE_NUMBER pages; while the last record read
// is still inside the cursor's second we keep paging (the stored cursor could not move past it otherwise).
// If the per-poll budget runs out inside that second, the poll is marked incomplete: the next poll re-reads
// the second from page 1 (never from a saved page number, which deletions between polls would shift) with
// a budget covering every record already scanned plus maxPages more, and the cursor ids skip what was emitted.
async function fetchSince({
  client,
  objectSystemName,
  field,
  since,
  alreadyScanned = 0,
  maxPages = MAX_PAGES_PER_POLL,
}: {
  client: FireberryClient;
  objectSystemName: string;
  field: string;
  since: string | null;
  alreadyScanned?: number;
  maxPages?: number;
}): Promise<{ records: Record<string, unknown>[]; primaryKey: string; incomplete?: boolean }> {
  const objectType = await client.resolveObjectTypeNumber(objectSystemName);
  const records: Record<string, unknown>[] = [];
  const pageBudget = Math.ceil(alreadyScanned / FIREBERRY_LIMITS.MAX_PAGE_SIZE) + maxPages;
  let primaryKey = '';
  for (let page = 1; ; page++) {
    const result = await client.query({
      objecttype: objectType,
      query: since ? `(${field} >= ${toQueryTimestamp(since)})` : undefined,
      sort_by: field,
      sort_type: 'asc',
      page_size: FIREBERRY_LIMITS.MAX_PAGE_SIZE,
      page_number: page,
    });
    primaryKey = result.PrimaryKey || primaryKey;
    records.push(...result.Data);
    if (result.IsLastPage || result.Data.length < FIREBERRY_LIMITS.MAX_PAGE_SIZE) {
      return { records, primaryKey };
    }
    const last = result.Data[result.Data.length - 1];
    const stillInCursorSecond = since !== null && sameQuerySecond({ timestamp: readString({ record: last, key: field }), since });
    if (!stillInCursorSecond && page >= FIREBERRY_LIMITS.MAX_PAGE_NUMBER) {
      return { records, primaryKey };
    }
    if (stillInCursorSecond && page >= pageBudget) {
      const tied = records.filter((record) => sameQuerySecond({ timestamp: readString({ record, key: field }), since })).length;
      if (tied >= MAX_RECORDS_IN_ONE_SECOND) {
        // At the cap: only fail if the next record is confirmed to still be in the same second.
        const peek = await client.query({
          objecttype: objectType,
          query: `(${field} >= ${toQueryTimestamp(since)})`,
          sort_by: field,
          sort_type: 'asc',
          page_size: FIREBERRY_LIMITS.MAX_PAGE_SIZE,
          page_number: page + 1,
        });
        const next = peek.Data[0];
        if (next !== undefined && sameQuerySecond({ timestamp: readString({ record: next, key: field }), since })) {
          throw new Error(
            `More than ${MAX_RECORDS_IN_ONE_SECOND} Fireberry records share the ${field} second ${toQueryTimestamp(since)}. Fireberry filters by whole seconds, so the trigger cannot page through a bulk change this large without skipping records. Split the bulk update or import into smaller batches.`,
          );
        }
        // The tied second ends here; keep the newer records read so the cursor moves past the second.
        records.push(...peek.Data);
        return { records, primaryKey: peek.PrimaryKey || primaryKey };
      }
      return { records, primaryKey, incomplete: true };
    }
  }
}

// Builds the starting cursor from the newest records, paging (newest first) until the timestamp changes
// or the last page, so every id tied at the newest timestamp is recorded and none fires on the first poll.
async function latestCursor({
  client,
  objectSystemName,
  field,
  maxPages = MAX_PAGES_PER_POLL,
}: {
  client: FireberryClient;
  objectSystemName: string;
  field: string;
  maxPages?: number;
}): Promise<RecordCursor | null> {
  const objectType = await client.resolveObjectTypeNumber(objectSystemName);
  const records: Record<string, unknown>[] = [];
  let primaryKey = '';
  for (let page = 1; page <= maxPages; page++) {
    const result = await client.query({
      objecttype: objectType,
      sort_by: field,
      sort_type: 'desc',
      page_size: FIREBERRY_LIMITS.MAX_PAGE_SIZE,
      page_number: page,
    });
    primaryKey = result.PrimaryKey || primaryKey;
    records.push(...result.Data);
    if (result.IsLastPage || result.Data.length < FIREBERRY_LIMITS.MAX_PAGE_SIZE) {
      break;
    }
    const newest = readString({ record: records[0], key: field });
    const last = readString({ record: result.Data[result.Data.length - 1], key: field });
    if (!newest || !last || compareTimestamps({ a: last, b: newest }) !== 0) {
      break;
    }
  }
  return cursorFromNewest({ records, field, primaryKey });
}

async function pollOnce({
  client,
  objectSystemName,
  field,
  cursor,
  triggerType,
  maxPages,
}: {
  client: FireberryClient;
  objectSystemName: string;
  field: string;
  cursor: RecordCursor | null;
  triggerType: string | undefined;
  maxPages?: number;
}): Promise<{ items: Record<string, unknown>[]; cursor: RecordCursor | null }> {
  const { records, primaryKey, incomplete } = await fetchSince({
    client,
    objectSystemName,
    field,
    since: cursor?.timestamp ?? null,
    alreadyScanned: cursor?.scanned ?? 0,
    maxPages,
  });
  const base = cursor ? { timestamp: cursor.timestamp, ids: cursor.ids } : null;
  const selection = selectNewRecords({ records, cursor: base, field, primaryKey, triggerType });
  const next = selection.cursor ? { timestamp: selection.cursor.timestamp, ids: selection.cursor.ids } : null;
  if (next && incomplete) {
    // Every record read sits in the cursor's second, so the cursor stays inside that unfinished second.
    return { items: selection.items, cursor: { ...next, scanned: records.length } };
  }
  return { items: selection.items, cursor: next };
}

function cursorFromNewest({ records, field, primaryKey }: { records: Record<string, unknown>[]; field: string; primaryKey: string }): RecordCursor | null {
  let timestamp: string | null = null;
  for (const record of records) {
    const value = readString({ record, key: field });
    if (value && (timestamp === null || compareTimestamps({ a: value, b: timestamp }) > 0)) {
      timestamp = value;
    }
  }
  if (timestamp === null) {
    return null;
  }
  const newest = timestamp;
  const ids = records
    .filter((record) => {
      const value = readString({ record, key: field });
      return value !== undefined && compareTimestamps({ a: value, b: newest }) === 0;
    })
    .map((record) => recordId({ record, primaryKey }));
  return { timestamp: newest, ids };
}

export const recordCreatedOrUpdatedTrigger = createTrigger({
  name: 'record_created_or_updated',
  classification: 'READ',
  displayName: 'Record Created or Updated',
  description: 'Fires when a record is created or updated in Fireberry.',
  aiMetadata: {
    description: 'Polls a chosen Fireberry object type and fires once per record that was created or modified since the previous poll, in chronological order. The trigger type selects which events qualify: created only, updated only, or both. Each emitted item is the full record.',
  },
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    triggerType: Property.StaticDropdown({
      displayName: 'Trigger Type',
      required: true,
      defaultValue: 'both',
      options: {
        disabled: false,
        options: [
          { label: 'Created or Updated', value: 'both' },
          { label: 'Created Only', value: 'created' },
          { label: 'Updated Only', value: 'updated' },
        ],
      },
    }),
    lookbackMinutes: Property.Number({
      displayName: 'Lookback Period (minutes) (no longer used)',
      required: false,
      description: 'No longer used. The trigger now tracks Fireberry timestamps; kept so existing flows still load.',
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    accountid: '12345678-1234-1234-1234-123456789abc',
    accountname: 'Sample Account',
    emailaddress1: 'sample@example.com',
    createdon: '2025-07-17T10:39:30.003',
    modifiedon: '2025-07-17T10:39:30.003',
  },
  async test({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const field = timestampField(propsValue.triggerType);
    const objectType = await client.resolveObjectTypeNumber(propsValue.objectType);
    const result = await client.query({ objecttype: objectType, sort_by: field, sort_type: 'desc', page_size: 5, page_number: 1 });
    return result.Data;
  },
  async onEnable({ auth, propsValue, store, isRepublish }) {
    if (isRepublish && (await store.get<StoredCursor>(CURSOR_KEY))) {
      return;
    }
    const client = new FireberryClient(auth.secret_text);
    const cursor = await latestCursor({ client, objectSystemName: propsValue.objectType, field: timestampField(propsValue.triggerType) });
    await store.put(CURSOR_KEY, { cursor });
    await store.delete(LEGACY_KEY);
  },
  async onDisable({ store, isRepublish }) {
    if (isRepublish) {
      return;
    }
    await store.delete(CURSOR_KEY);
    await store.delete(LEGACY_KEY);
  },
  async run({ auth, propsValue, store }) {
    const client = new FireberryClient(auth.secret_text);
    const field = timestampField(propsValue.triggerType);
    const stored = await store.get<StoredCursor>(CURSOR_KEY);
    if (!stored) {
      const cursor = await latestCursor({ client, objectSystemName: propsValue.objectType, field });
      await store.put(CURSOR_KEY, { cursor });
      return [];
    }
    const selection = await pollOnce({ client, objectSystemName: propsValue.objectType, field, cursor: stored.cursor, triggerType: propsValue.triggerType });
    await store.put(CURSOR_KEY, { cursor: selection.cursor });
    return selection.items;
  },
});

export const fireberryRecordPolling = { selectNewRecords, fetchSince, compareTimestamps, toQueryTimestamp, cursorFromNewest, latestCursor, pollOnce };

type RecordCursor = {
  timestamp: string;
  ids: string[];
  scanned?: number;
};

type StoredCursor = {
  cursor: RecordCursor | null;
};
