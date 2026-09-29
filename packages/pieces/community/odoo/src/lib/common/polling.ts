import { Store } from '@activepieces/pieces-framework';
import { OdooClient, OdooFieldMap } from './client';
import { odooRecords } from './records';
import { Domain, odooDates, odooDomain, odooOutput } from './values';

async function newestCursor({ client, source }: { client: OdooClient; source: PollSource }): Promise<PollCursor> {
  const rows = await client.call<Record<string, unknown>[]>({
    model: source.model,
    method: 'search_read',
    args: [odooDomain.andDomains([source.domain, [[source.dateField, '!=', false]]])],
    kwargs: { fields: ['id', source.dateField], order: `${source.dateField} desc, id desc`, limit: 1, context: source.context },
  });
  const row = Array.isArray(rows) ? rows[0] : undefined;
  if (!row) return EMPTY_CURSOR;
  const newest = cursorOf({ row, dateField: source.dateField });
  const sameSecond = await client.call<Record<string, unknown>[]>({
    model: source.model,
    method: 'search_read',
    args: [odooDomain.andDomains([source.domain, inSecond({ dateField: source.dateField, date: newest.date })])],
    kwargs: { fields: ['id'], order: 'id desc', limit: 1, context: source.context },
  });
  const maxId = Array.isArray(sameSecond) && typeof sameSecond[0]?.['id'] === 'number' ? sameSecond[0]['id'] : newest.id;
  return { date: newest.date, id: Math.max(newest.id, maxId) };
}

function cursorOf({ row, dateField }: { row: Record<string, unknown>; dateField: string }): PollCursor {
  const date = row[dateField];
  const id = row['id'];
  return {
    date: typeof date === 'string' ? date : EMPTY_CURSOR.date,
    id: typeof id === 'number' ? id : 0,
  };
}

function nextSecond(date: string): string {
  const epoch = odooDates.parseOdooDatetime(date);
  if (epoch === null) throw new Error(`Invalid trigger cursor date "${date}".`);
  return odooDates.toOdooDatetime(epoch + 1000);
}

function inSecond({ dateField, date }: { dateField: string; date: string }): Domain {
  return [
    [dateField, '>=', date],
    [dateField, '<', nextSecond(date)],
  ];
}

function afterCursor({ dateField, cursor }: { dateField: string; cursor: PollCursor }): { rest: Domain; later: Domain } {
  return {
    rest: [...inSecond({ dateField, date: cursor.date }), ['id', '>', cursor.id]],
    later: [[dateField, '>=', nextSecond(cursor.date)]],
  };
}

async function pollAfter({
  client,
  source,
  cursor,
  pageSize = PAGE_SIZE,
  maxPages = MAX_PAGES,
}: {
  client: OdooClient;
  source: PollSource;
  cursor: PollCursor;
  pageSize?: number;
  maxPages?: number;
}): Promise<{ records: Record<string, unknown>[]; cursor: PollCursor }> {
  const { names, map } = await fieldsFor({ client, source });
  const collected: Record<string, unknown>[] = [];
  const read = async ({ domain, order }: { domain: Domain; order: string }) => {
    const rows = await client.call<Record<string, unknown>[]>({
      model: source.model,
      method: 'search_read',
      args: [odooDomain.andDomains([source.domain, domain])],
      kwargs: { fields: names, order, limit: pageSize, context: source.context },
    });
    return Array.isArray(rows) ? rows : [];
  };
  const emit = (row: Record<string, unknown>) =>
    collected.push(pad({ record: odooOutput.normalizeRecord({ record: row, fields: map, requested: names }), source }));
  const dateOf = (row: Record<string, unknown>) => cursorOf({ row, dateField: source.dateField }).date;
  let current = cursor;
  let queries = 0;
  while (queries < maxPages * 2 && collected.length < pageSize * maxPages) {
    const window = afterCursor({ dateField: source.dateField, cursor: current });
    const rest = await read({ domain: window.rest, order: 'id asc' });
    queries++;
    for (const row of rest) {
      emit(row);
      current = { date: current.date, id: cursorOf({ row, dateField: source.dateField }).id };
    }
    if (rest.length === pageSize) continue;
    const later = await read({ domain: window.later, order: `${source.dateField} asc, id asc` });
    queries++;
    if (later.length === 0) break;
    const full = later.length === pageSize;
    const lastSecond = dateOf(later[later.length - 1]);
    const complete = (full ? later.filter((row) => dateOf(row) !== lastSecond) : later)
      .map((row) => ({ row, key: cursorOf({ row, dateField: source.dateField }) }))
      .sort((a, b) => (a.key.date === b.key.date ? a.key.id - b.key.id : a.key.date < b.key.date ? -1 : 1));
    for (const { row, key } of complete) {
      emit(row);
      current = key;
    }
    if (!full) break;
    current = { date: lastSecond, id: 0 };
  }
  return { records: collected, cursor: current };
}

async function latest({ client, source, limit = 5 }: { client: OdooClient; source: PollSource; limit?: number }): Promise<Record<string, unknown>[]> {
  const { names, map } = await fieldsFor({ client, source });
  const rows = await client.call<Record<string, unknown>[]>({
    model: source.model,
    method: 'search_read',
    args: [source.domain],
    kwargs: { fields: names, order: `${source.dateField} desc, id desc`, limit, context: source.context },
  });
  const list = Array.isArray(rows) ? rows : [];
  return list.map((row) => pad({ record: odooOutput.normalizeRecord({ record: row, fields: map, requested: names }), source }));
}

function pad({ record, source }: { record: Record<string, unknown>; source: PollSource }): Record<string, unknown> {
  const known = source.knownFields ?? [];
  const manyToOne = source.manyToOne ?? [];
  const declared = [
    ...(known.includes('id') ? [] : ['id']),
    ...known.flatMap((name) => (manyToOne.includes(name) ? [name, `${name}_name`] : [name])),
    ...manyToOne.filter((name) => !known.includes(name)).map((name) => `${name}_name`),
  ];
  const placed = new Set(declared);
  return Object.fromEntries([
    ...declared.filter((key) => key !== 'id' || key in record).map((key): [string, unknown] => [key, key in record ? record[key] : null]),
    ...Object.entries(record).filter(([key]) => !placed.has(key)),
  ]);
}

async function fieldsFor({ client, source }: { client: OdooClient; source: PollSource }): Promise<{ names: string[]; map: OdooFieldMap }> {
  const resolved = source.knownFields
    ? await odooRecords.resolveKnownFields({ client, model: source.model, wanted: source.knownFields })
    : await odooRecords.resolveFields({ client, model: source.model, fields: source.fields });
  const names = resolved.names.includes(source.dateField) ? resolved.names : [...resolved.names, source.dateField];
  return { names, map: resolved.map };
}

async function onEnable({ client, source, store, isRepublish }: HookParams & { isRepublish?: boolean }): Promise<void> {
  if (isRepublish && (await store.get<PollCursor>(CURSOR_KEY))) return;
  const cursor = await newestCursor({ client, source });
  await store.put(CURSOR_KEY, cursor);
}

async function onDisable({ store }: { store: Store }): Promise<void> {
  await store.delete(CURSOR_KEY);
}

async function run({ client, source, store }: HookParams): Promise<Record<string, unknown>[]> {
  const stored = await store.get<PollCursor>(CURSOR_KEY);
  const cursor = stored ?? (await newestCursor({ client, source }));
  if (!stored) {
    await store.put(CURSOR_KEY, cursor);
    return [];
  }
  const result = await pollAfter({ client, source, cursor });
  if (result.cursor.date !== cursor.date || result.cursor.id !== cursor.id) {
    await store.put(CURSOR_KEY, result.cursor);
  }
  return result.records;
}

async function test({ client, source }: { client: OdooClient; source: PollSource }): Promise<Record<string, unknown>[]> {
  return latest({ client, source });
}

const CURSOR_KEY = 'odoo_poll_cursor';
const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const EMPTY_CURSOR: PollCursor = { date: '1970-01-01 00:00:00', id: 0 };

export const odooPolling = {
  onEnable,
  onDisable,
  run,
  test,
  pollAfter,
  newestCursor,
  afterCursor,
  CURSOR_KEY,
};

export type PollCursor = { date: string; id: number };

export type PollSource = {
  model: string;
  dateField: string;
  domain: Domain;
  fields?: string[];
  knownFields?: readonly string[];
  manyToOne?: readonly string[];
  context?: Record<string, unknown>;
};

type HookParams = { client: OdooClient; source: PollSource; store: Store };
