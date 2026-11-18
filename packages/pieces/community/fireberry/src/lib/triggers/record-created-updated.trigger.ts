import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../auth';
import { objectTypeDropdown } from '../common/props';
import { FireberryClient, FIREBERRY_LIMITS } from '../common/client';

const CURSOR_KEY = 'fireberry_record_cursor';
const LEGACY_KEY = 'lastPollTime';
const CREATE_STAMP_TOLERANCE_MS = 2000;

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

function querySecond(timestamp: string | undefined): string | undefined {
  return timestamp === undefined ? undefined : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.exec(timestamp)?.[0];
}

function nextSecond(second: string): string {
  return new Date(Date.parse(`${second}Z`) + 1000).toISOString().slice(0, 19);
}

function overflowError({ field, second }: { field: string; second: string }): Error {
  return new Error(
    `More than ${FIREBERRY_LIMITS.MAX_PAGE_SIZE * FIREBERRY_LIMITS.MAX_PAGE_NUMBER} Fireberry records share the ${field} second ${second}. Fireberry's query API returns at most ${FIREBERRY_LIMITS.MAX_PAGE_NUMBER} pages of ${FIREBERRY_LIMITS.MAX_PAGE_SIZE} records and filters by whole seconds, so the records after the first ${FIREBERRY_LIMITS.MAX_PAGE_SIZE * FIREBERRY_LIMITS.MAX_PAGE_NUMBER} in that second could not be read and were not sent. The trigger has moved on to the next second and sends new records again from the next poll. Check the records changed in that second (for example with Find Records) if you need them.`,
  );
}

async function fetchSince({
  client,
  objectSystemName,
  field,
  since,
}: {
  client: FireberryClient;
  objectSystemName: string;
  field: string;
  since: string | null;
}): Promise<{ records: Record<string, unknown>[]; primaryKey: string; overflowSecond?: string }> {
  const objectType = await client.resolveObjectTypeNumber(objectSystemName);
  const records: Record<string, unknown>[] = [];
  let primaryKey = '';
  for (let page = 1; page <= FIREBERRY_LIMITS.MAX_PAGE_NUMBER; page++) {
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
  }
  const lastSecond = querySecond(readString({ record: records[records.length - 1], key: field }));
  if (since !== null && lastSecond !== undefined && lastSecond === toQueryTimestamp(since)) {
    return { records, primaryKey, overflowSecond: lastSecond };
  }
  return { records, primaryKey };
}

async function latestCursor({
  client,
  objectSystemName,
  field,
}: {
  client: FireberryClient;
  objectSystemName: string;
  field: string;
}): Promise<RecordCursor | null> {
  const objectType = await client.resolveObjectTypeNumber(objectSystemName);
  const records: Record<string, unknown>[] = [];
  let primaryKey = '';
  for (let page = 1; page <= FIREBERRY_LIMITS.MAX_PAGE_NUMBER; page++) {
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
      return cursorFromNewest({ records, field, primaryKey });
    }
    const newestSecond = querySecond(readString({ record: records[0], key: field }));
    const lastSecond = querySecond(readString({ record: result.Data[result.Data.length - 1], key: field }));
    if (newestSecond === undefined || lastSecond !== newestSecond) {
      return cursorFromNewest({ records, field, primaryKey });
    }
  }
  const newestSecond = querySecond(readString({ record: records[0], key: field }));
  return newestSecond === undefined ? cursorFromNewest({ records, field, primaryKey }) : { timestamp: nextSecond(newestSecond), ids: [] };
}

async function pollOnce({
  client,
  objectSystemName,
  field,
  cursor,
  triggerType,
}: {
  client: FireberryClient;
  objectSystemName: string;
  field: string;
  cursor: RecordCursor | null;
  triggerType: string | undefined;
}): Promise<{ items: Record<string, unknown>[]; cursor: RecordCursor | null }> {
  const { records, primaryKey, overflowSecond } = await fetchSince({
    client,
    objectSystemName,
    field,
    since: cursor?.timestamp ?? null,
  });
  const base = cursor ? { timestamp: cursor.timestamp, ids: cursor.ids } : null;
  const selection = selectNewRecords({ records, cursor: base, field, primaryKey, triggerType });
  if (overflowSecond !== undefined) {
    return { items: selection.items, cursor: { timestamp: nextSecond(overflowSecond), ids: [], skippedSecond: overflowSecond } };
  }
  return { items: selection.items, cursor: selection.cursor };
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
  async onDisable() {
    return;
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
    const skippedSecond = stored.cursor?.skippedSecond;
    if (stored.cursor && skippedSecond) {
      await store.put(CURSOR_KEY, { cursor: { timestamp: stored.cursor.timestamp, ids: stored.cursor.ids } });
      throw overflowError({ field, second: skippedSecond });
    }
    const selection = await pollOnce({ client, objectSystemName: propsValue.objectType, field, cursor: stored.cursor, triggerType: propsValue.triggerType });
    await store.put(CURSOR_KEY, { cursor: selection.cursor });
    return selection.items;
  },
});

export const fireberryRecordPolling = { selectNewRecords, fetchSince, compareTimestamps, toQueryTimestamp, cursorFromNewest, latestCursor, pollOnce, nextSecond };

type RecordCursor = {
  timestamp: string;
  ids: string[];
  skippedSecond?: string;
};

type StoredCursor = {
  cursor: RecordCursor | null;
};
