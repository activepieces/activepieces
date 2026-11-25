import { QueryFilter, SageIntacctAuthValue, sageIntacctClient } from './client';

const CREATED_FIELD = 'audit.createdDateTime';
const EPOCH_MARKER = '1970-01-01T00:00:00Z';
const MAX_EMITTED_PER_POLL = 1000;
const MAX_SCANNED_PER_POLL = 10_000;
const TIE_CURSOR_THRESHOLD = MAX_EMITTED_PER_POLL;

async function enable({
  auth,
  store,
  storeKey,
  object,
  extraFilters,
  isRepublish,
}: {
  auth: SageIntacctAuthValue;
  store: PollStore;
  storeKey: string;
  object: string;
  extraFilters?: QueryFilter[];
  isRepublish?: boolean;
}): Promise<void> {
  if (isRepublish === true) {
    const existing = await store.get<PollState>(storeKey);
    if (existing && typeof existing.marker === 'string') {
      return;
    }
  }
  const seenKeys: string[] = [];
  let newest: string | null = null;
  let newestTime = 0;
  let start = 1;
  for (let pages = 0; pages < MAX_SCANNED_PER_POLL / sageIntacctClient.QUERY_PAGE_SIZE; pages++) {
    const page = await sageIntacctClient.queryPage({
      auth,
      object,
      fields: ['key', CREATED_FIELD],
      filters: extraFilters,
      orderBy: [{ [CREATED_FIELD]: 'desc' }, { key: 'desc' }],
      start,
      size: sageIntacctClient.QUERY_PAGE_SIZE,
    });
    if (newest === null) {
      newest = page.records[0] ? sageIntacctClient.readString({ record: page.records[0], path: CREATED_FIELD }) : null;
      if (newest === null || !Number.isFinite(Date.parse(newest))) {
        await store.put<PollState>(storeKey, { marker: EPOCH_MARKER, seenKeys: [] });
        return;
      }
      newestTime = Date.parse(newest);
    }
    let sawOlder = false;
    for (const record of page.records) {
      const created = sageIntacctClient.readString({ record, path: CREATED_FIELD });
      if (created === null || Date.parse(created) !== newestTime) {
        sawOlder = true;
        break;
      }
      const key = sageIntacctClient.readString({ record, path: 'key' });
      if (key !== null) {
        seenKeys.push(key);
      }
    }
    if (sawOlder || page.nextStart === null || page.records.length === 0) {
      break;
    }
    start = page.nextStart;
  }
  if (newest === null) {
    await store.put<PollState>(storeKey, { marker: EPOCH_MARKER, seenKeys: [] });
    return;
  }
  await store.put<PollState>(storeKey, { marker: newest, seenKeys });
}

async function disable(): Promise<void> {
  return;
}

async function pollNewRecords({
  auth,
  store,
  storeKey,
  object,
  fields,
  extraFilters,
}: {
  auth: SageIntacctAuthValue;
  store: PollStore;
  storeKey: string;
  object: string;
  fields: string[];
  extraFilters?: QueryFilter[];
}): Promise<Record<string, unknown>[]> {
  const state = await store.get<PollState>(storeKey);
  if (!state || typeof state.marker !== 'string') {
    await enable({ auth, store, storeKey, object, extraFilters });
    return [];
  }
  const seen = new Set(state.seenKeys ?? []);
  const query = pollQuery({ marker: state.marker, seenKeys: state.seenKeys ?? [], extraFilters });
  const emitted: Record<string, unknown>[] = [];
  const scanned: Record<string, unknown>[] = [];
  let start = 1;
  let more = true;
  while (more && emitted.length < MAX_EMITTED_PER_POLL) {
    if (scanned.length >= MAX_SCANNED_PER_POLL) {
      throw new Error(
        `Sage Intacct returned more than ${MAX_SCANNED_PER_POLL} ${object} records created at ${state.marker}; the trigger cannot advance safely.`,
      );
    }
    const page = await sageIntacctClient.queryPage({
      auth,
      object,
      fields,
      filters: query.filters,
      filterExpression: query.filterExpression,
      orderBy: [{ [CREATED_FIELD]: 'asc' }, { key: 'asc' }],
      start,
      size: sageIntacctClient.QUERY_PAGE_SIZE,
    });
    for (const record of page.records) {
      if (emitted.length >= MAX_EMITTED_PER_POLL) {
        break;
      }
      scanned.push(record);
      const key = sageIntacctClient.readString({ record, path: 'key' });
      if (key === null || !seen.has(key)) {
        emitted.push(record);
      }
    }
    more = page.nextStart !== null && page.records.length > 0;
    start = page.nextStart ?? start;
  }
  const next = nextState({ previous: state, scanned });
  if (next) {
    await store.put<PollState>(storeKey, next);
  }
  return emitted;
}

async function newestRecords({
  auth,
  object,
  fields,
  extraFilters,
}: {
  auth: SageIntacctAuthValue;
  object: string;
  fields: string[];
  extraFilters?: QueryFilter[];
}): Promise<Record<string, unknown>[]> {
  const page = await sageIntacctClient.queryPage({
    auth,
    object,
    fields,
    filters: extraFilters,
    orderBy: [{ [CREATED_FIELD]: 'desc' }, { key: 'desc' }],
    start: 1,
    size: 5,
  });
  return page.records;
}

async function maxKey({
  auth,
  object,
  extraFilters,
}: {
  auth: SageIntacctAuthValue;
  object: string;
  extraFilters?: QueryFilter[];
}): Promise<number> {
  const page = await sageIntacctClient.queryPage({
    auth,
    object,
    fields: ['key'],
    filters: extraFilters,
    orderBy: [{ key: 'desc' }],
    start: 1,
    size: 1,
  });
  const record = page.records[0];
  const key = record ? sageIntacctClient.readString({ record, path: 'key' }) : null;
  return key !== null && Number.isFinite(Number(key)) ? Number(key) : 0;
}

async function enableByKey({
  auth,
  store,
  storeKey,
  object,
  extraFilters,
  isRepublish,
}: {
  auth: SageIntacctAuthValue;
  store: PollStore;
  storeKey: string;
  object: string;
  extraFilters?: QueryFilter[];
  isRepublish?: boolean;
}): Promise<void> {
  if (isRepublish === true) {
    const existing = await store.get<KeyPollState>(storeKey);
    if (existing && typeof existing.lastKey === 'number') {
      return;
    }
  }
  await store.put<KeyPollState>(storeKey, { lastKey: await maxKey({ auth, object, extraFilters }) });
}

async function pollNewRecordsByKey({
  auth,
  store,
  storeKey,
  object,
  fields,
  extraFilters,
}: {
  auth: SageIntacctAuthValue;
  store: PollStore;
  storeKey: string;
  object: string;
  fields: string[];
  extraFilters?: QueryFilter[];
}): Promise<Record<string, unknown>[]> {
  const state = await store.get<KeyPollState>(storeKey);
  if (!state || typeof state.lastKey !== 'number') {
    await enableByKey({ auth, store, storeKey, object, extraFilters });
    return [];
  }
  const emitted: Record<string, unknown>[] = [];
  let lastKey = state.lastKey;
  let start = 1;
  let more = true;
  while (more && emitted.length < MAX_EMITTED_PER_POLL) {
    const page = await sageIntacctClient.queryPage({
      auth,
      object,
      fields,
      filters: [{ $gt: { key: String(state.lastKey) } }, ...(extraFilters ?? [])],
      orderBy: [{ key: 'asc' }],
      start,
      size: sageIntacctClient.QUERY_PAGE_SIZE,
    });
    for (const record of page.records) {
      if (emitted.length >= MAX_EMITTED_PER_POLL) {
        break;
      }
      emitted.push(record);
      const key = sageIntacctClient.readString({ record, path: 'key' });
      if (key !== null && Number.isFinite(Number(key)) && Number(key) > lastKey) {
        lastKey = Number(key);
      }
    }
    more = page.nextStart !== null && page.records.length > 0;
    start = page.nextStart ?? start;
  }
  if (lastKey !== state.lastKey) {
    await store.put<KeyPollState>(storeKey, { lastKey });
  }
  return emitted;
}

async function newestRecordsByKey({
  auth,
  object,
  fields,
  extraFilters,
}: {
  auth: SageIntacctAuthValue;
  object: string;
  fields: string[];
  extraFilters?: QueryFilter[];
}): Promise<Record<string, unknown>[]> {
  const page = await sageIntacctClient.queryPage({
    auth,
    object,
    fields,
    filters: extraFilters,
    orderBy: [{ key: 'desc' }],
    start: 1,
    size: 5,
  });
  return page.records;
}

function pollQuery({
  marker,
  seenKeys,
  extraFilters,
}: {
  marker: string;
  seenKeys: string[];
  extraFilters?: QueryFilter[];
}): { filters: QueryFilter[]; filterExpression?: string } {
  const extras = extraFilters ?? [];
  const numericKeys = seenKeys.map(Number).filter((value) => Number.isFinite(value));
  if (seenKeys.length < TIE_CURSOR_THRESHOLD || numericKeys.length === 0) {
    return { filters: [{ $gte: { [CREATED_FIELD]: marker } }, ...extras] };
  }
  const watermark = String(numericKeys.reduce((best, value) => (value > best ? value : best)));
  const filters: QueryFilter[] = [
    { $gt: { [CREATED_FIELD]: marker } },
    { $eq: { [CREATED_FIELD]: marker } },
    { $gt: { key: watermark } },
    ...extras,
  ];
  const extraClause = extras.map((_, index) => ` and ${index + 4}`).join('');
  return { filters, filterExpression: `(1 or (2 and 3))${extraClause}` };
}

function nextState({ previous, scanned }: { previous: PollState; scanned: Record<string, unknown>[] }): PollState | null {
  const stamped = scanned
    .map((record) => ({
      key: sageIntacctClient.readString({ record, path: 'key' }),
      created: sageIntacctClient.readString({ record, path: CREATED_FIELD }),
    }))
    .filter((entry): entry is { key: string | null; created: string } => entry.created !== null && Number.isFinite(Date.parse(entry.created)));
  if (stamped.length === 0) {
    return null;
  }
  const latest = stamped.reduce((best, entry) => (Date.parse(entry.created) > Date.parse(best.created) ? entry : best));
  const latestTime = Date.parse(latest.created);
  const keysAtLatest = stamped
    .filter((entry) => Date.parse(entry.created) === latestTime)
    .map((entry) => entry.key)
    .filter((key): key is string => key !== null);
  const carried = Date.parse(previous.marker) === latestTime ? previous.seenKeys ?? [] : [];
  return { marker: latest.created, seenKeys: Array.from(new Set([...carried, ...keysAtLatest])) };
}

export const sageIntacctPoll = {
  CREATED_FIELD,
  MAX_EMITTED_PER_POLL,
  enable,
  disable,
  pollNewRecords,
  newestRecords,
  nextState,
  enableByKey,
  pollNewRecordsByKey,
  newestRecordsByKey,
  pollQuery,
};

export type PollState = { marker: string; seenKeys: string[] };
export type KeyPollState = { lastKey: number };
export type PollStore = {
  get: <T>(key: string) => Promise<T | null>;
  put: <T>(key: string, value: T) => Promise<T>;
  delete: (key: string) => Promise<void>;
};
