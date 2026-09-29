import { Store } from '@activepieces/pieces-framework';
import { OdooClient, OdooFieldMap } from './client';
import { odooRecords } from './records';
import { Domain, odooDates, odooDomain, odooInput, odooOutput } from './values';

async function newestCursor({ client, source }: { client: OdooClient; source: PollSource }): Promise<PollCursor> {
  const rows = await client.call<Record<string, unknown>[]>({
    model: source.model,
    method: 'search_read',
    args: [odooDomain.andDomains([source.domain, [[source.dateField, '!=', false]]])],
    kwargs: { fields: ['id', source.dateField], order: `${source.dateField} desc, id desc`, limit: 1, context: source.context },
  });
  const row = Array.isArray(rows) ? rows[0] : undefined;
  const date = row ? secondOf(row[source.dateField]) : null;
  if (!row || !date) return EMPTY_CURSOR;
  const sameSecond = await client.call<Record<string, unknown>[]>({
    model: source.model,
    method: 'search_read',
    args: [odooDomain.andDomains([source.domain, inSecond({ dateField: source.dateField, date })])],
    kwargs: { fields: ['id', source.dateField], order: 'id asc', context: source.context },
  });
  const seed = advance({ cursor: { date, idsAtDate: [] }, rows: [row], dateField: source.dateField });
  return advance({ cursor: seed, rows: Array.isArray(sameSecond) ? sameSecond : [], dateField: source.dateField });
}

function secondOf(value: unknown): string | null {
  const epoch = odooDates.parseOdooDatetime(value);
  return epoch === null ? null : odooDates.toOdooDatetime(epoch);
}

function advance({ cursor, rows, dateField }: { cursor: PollCursor; rows: Record<string, unknown>[]; dateField: string }): PollCursor {
  return rows.reduce<PollCursor>((acc, row) => {
    const date = secondOf(row[dateField]);
    const id = row['id'];
    if (date === null || typeof id !== 'number' || date < acc.date) return acc;
    if (date > acc.date) return { date, idsAtDate: [id] };
    return acc.idsAtDate.includes(id) ? acc : { date, idsAtDate: [...acc.idsAtDate, id] };
  }, cursor);
}

function isSeen({ row, cursor, dateField }: { row: Record<string, unknown>; cursor: PollCursor; dateField: string }): boolean {
  const id = row['id'];
  return secondOf(row[dateField]) === cursor.date && typeof id === 'number' && cursor.idsAtDate.includes(id);
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

function afterCursor({ dateField, cursor }: { dateField: string; cursor: PollCursor }): Domain {
  if (cursor.idsAtDate.length === 0) return [[dateField, '>=', cursor.date]];
  return [[dateField, '>=', cursor.date], '|', [dateField, '>=', nextSecond(cursor.date)], ['id', 'not in', cursor.idsAtDate]];
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
  let current = cursor;
  for (let page = 0; page < maxPages; page++) {
    const rows = await client.call<Record<string, unknown>[]>({
      model: source.model,
      method: 'search_read',
      args: [odooDomain.andDomains([source.domain, afterCursor({ dateField: source.dateField, cursor: current })])],
      kwargs: { fields: names, order: `${source.dateField} asc, id asc`, limit: pageSize, context: source.context },
    });
    const list = Array.isArray(rows) ? rows : [];
    const seen = current;
    for (const row of list.filter((candidate) => !isSeen({ row: candidate, cursor: seen, dateField: source.dateField }))) {
      collected.push(pad({ record: odooOutput.normalizeRecord({ record: row, fields: map, requested: names }), source }));
    }
    current = advance({ cursor: current, rows: list, dateField: source.dateField });
    if (list.length < pageSize) break;
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

function readCursor(value: unknown): PollCursor | null {
  if (!odooInput.isRecord(value)) return null;
  const date = value['date'];
  const ids = value['idsAtDate'];
  if (typeof date !== 'string' || !Array.isArray(ids)) return null;
  return { date, idsAtDate: ids.filter((id): id is number => typeof id === 'number') };
}

function readIds(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : [];
}

async function recentIds({ client, source }: { client: OdooClient; source: PollSource }): Promise<number[]> {
  const ids = await client.call<number[]>({
    model: source.model,
    method: 'search',
    args: [source.domain],
    kwargs: { order: `${source.dateField} desc, id desc`, limit: MAX_EMITTED, context: source.context },
  });
  return readIds(ids).reverse();
}

async function seed({ client, source, store }: HookParams): Promise<void> {
  await store.put(CURSOR_KEY, await newestCursor({ client, source }));
  if (source.emitOnce) await store.put(EMITTED_KEY, await recentIds({ client, source }));
}

async function onEnable({ client, source, store, isRepublish }: HookParams & { isRepublish?: boolean }): Promise<void> {
  if (isRepublish && readCursor(await store.get<unknown>(CURSOR_KEY))) return;
  await seed({ client, source, store });
}

async function onDisable({ store }: { store: Store }): Promise<void> {
  await store.delete(CURSOR_KEY);
  await store.delete(EMITTED_KEY);
}

async function run({ client, source, store }: HookParams): Promise<Record<string, unknown>[]> {
  const cursor = readCursor(await store.get<unknown>(CURSOR_KEY));
  if (!cursor) {
    await seed({ client, source, store });
    return [];
  }
  const result = await pollAfter({ client, source, cursor });
  if (result.cursor.date !== cursor.date || result.cursor.idsAtDate.length !== cursor.idsAtDate.length) {
    await store.put(CURSOR_KEY, result.cursor);
  }
  if (!source.emitOnce) return result.records;
  const emitted = readIds(await store.get<unknown>(EMITTED_KEY));
  const done = new Set(emitted);
  const fresh = result.records.filter((record) => typeof record['id'] !== 'number' || !done.has(record['id']));
  const freshIds = readIds(fresh.map((record) => record['id']));
  if (freshIds.length > 0) await store.put(EMITTED_KEY, [...emitted, ...freshIds].slice(-MAX_EMITTED));
  return fresh;
}

async function test({ client, source }: { client: OdooClient; source: PollSource }): Promise<Record<string, unknown>[]> {
  return latest({ client, source });
}

const CURSOR_KEY = 'odoo_poll_cursor';
const EMITTED_KEY = 'odoo_poll_emitted_ids';
const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const MAX_EMITTED = 2000;
const EMPTY_CURSOR: PollCursor = { date: '1970-01-01 00:00:00', idsAtDate: [] };

export const odooPolling = {
  onEnable,
  onDisable,
  run,
  test,
  pollAfter,
  newestCursor,
  afterCursor,
  CURSOR_KEY,
  EMITTED_KEY,
  MAX_EMITTED,
};

export type PollCursor = { date: string; idsAtDate: number[] };

export type PollSource = {
  model: string;
  dateField: string;
  domain: Domain;
  fields?: string[];
  knownFields?: readonly string[];
  manyToOne?: readonly string[];
  context?: Record<string, unknown>;
  emitOnce?: boolean;
};

type HookParams = { client: OdooClient; source: PollSource; store: Store };
