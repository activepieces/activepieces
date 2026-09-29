import { Store } from '@activepieces/pieces-framework';
import { OdooClient, OdooFieldMap } from './client';
import { odooRecords } from './records';
import { Condition, Domain, odooDates, odooDomain, odooInput, odooOutput } from './values';

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
    args: [odooDomain.andDomains([source.domain, [[source.dateField, '>=', date], [source.dateField, '<', shiftSeconds({ date, seconds: 1 })]]])],
    kwargs: { fields: ['id', source.dateField], order: 'id asc', limit: MAX_WINDOW_ENTRIES, context: source.context },
  });
  const emitted = [row, ...(Array.isArray(sameSecond) ? sameSecond : [])].flatMap((candidate) => entryOf({ row: candidate, dateField: source.dateField }));
  return { date, floor: date, emitted: remember({ emitted: [], entries: emitted }) };
}

function secondOf(value: unknown): string | null {
  const epoch = odooDates.parseOdooDatetime(value);
  return epoch === null ? null : odooDates.toOdooDatetime(epoch);
}

function shiftSeconds({ date, seconds }: { date: string; seconds: number }): string {
  const epoch = odooDates.parseOdooDatetime(date);
  if (epoch === null) throw new Error(`Invalid trigger cursor date "${date}".`);
  return odooDates.toOdooDatetime(epoch + seconds * 1000);
}

function entryOf({ row, dateField }: { row: Record<string, unknown>; dateField: string }): EmittedEntry[] {
  const id = row['id'];
  const date = secondOf(row[dateField]);
  return typeof id === 'number' && date !== null ? [{ id, date }] : [];
}

function remember({ emitted, entries }: { emitted: EmittedEntry[]; entries: EmittedEntry[] }): EmittedEntry[] {
  const latest = new Map<number, EmittedEntry>();
  for (const entry of [...emitted, ...entries]) {
    const known = latest.get(entry.id);
    if (!known || entry.date >= known.date) latest.set(entry.id, entry);
  }
  return [...latest.values()].sort((a, b) => (a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1));
}

function windowStart(cursor: PollCursor): string {
  const lookBack = shiftSeconds({ date: cursor.date, seconds: -LOOK_BACK_SECONDS });
  return cursor.floor !== null && cursor.floor > lookBack ? cursor.floor : lookBack;
}

function unseenDomain({ dateField, cursor }: { dateField: string; cursor: PollCursor }): Domain {
  const bySecond = new Map<string, number[]>();
  for (const entry of cursor.emitted) bySecond.set(entry.date, [...(bySecond.get(entry.date) ?? []), entry.id]);
  const exclusions = [...bySecond.entries()].map(([date, ids]): Domain => [
    '|',
    ['id', 'not in', ids],
    [dateField, '>=', shiftSeconds({ date, seconds: 1 })],
  ]);
  const start: Condition = [dateField, '>=', windowStart(cursor)];
  return odooDomain.andDomains([[start], ...exclusions]);
}

function isEmitted({ row, cursor, dateField }: { row: Record<string, unknown>; cursor: PollCursor; dateField: string }): boolean {
  const [entry] = entryOf({ row, dateField });
  return entry === undefined || cursor.emitted.some((known) => known.id === entry.id && known.date >= entry.date);
}

function settle(cursor: PollCursor): PollCursor {
  const lookBack = shiftSeconds({ date: cursor.date, seconds: -LOOK_BACK_SECONDS });
  const inWindow = cursor.emitted.filter((entry) => entry.date >= lookBack);
  const dropped = inWindow.slice(0, Math.max(0, inWindow.length - MAX_WINDOW_ENTRIES));
  const kept = inWindow.slice(dropped.length);
  const lastDropped = dropped[dropped.length - 1];
  const capFloor = lastDropped ? shiftSeconds({ date: lastDropped.date, seconds: 1 }) : null;
  const floors = [cursor.floor, capFloor].filter((floor): floor is string => floor !== null && floor > lookBack);
  const floor = floors.length > 0 ? floors.reduce((a, b) => (a > b ? a : b)) : null;
  return { date: cursor.date, floor, emitted: kept };
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
      args: [odooDomain.andDomains([source.domain, unseenDomain({ dateField: source.dateField, cursor: current })])],
      kwargs: { fields: names, order: `${source.dateField} asc, id asc`, limit: pageSize, context: source.context },
    });
    const list = Array.isArray(rows) ? rows : [];
    const seen = current;
    const fresh = list.filter((row) => !isEmitted({ row, cursor: seen, dateField: source.dateField }));
    for (const row of fresh) {
      collected.push(pad({ record: odooOutput.normalizeRecord({ record: row, fields: map, requested: names }), source }));
    }
    const entries = fresh.flatMap((row) => entryOf({ row, dateField: source.dateField }));
    const newest = entries.reduce((max, entry) => (entry.date > max ? entry.date : max), current.date);
    current = { date: newest, floor: current.floor, emitted: remember({ emitted: current.emitted, entries }) };
    if (list.length < pageSize || fresh.length === 0) break;
  }
  return { records: collected, cursor: settle(current) };
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
  const floor = value['floor'];
  const emitted = value['emitted'];
  if (typeof date !== 'string' || secondOf(date) !== date || !Array.isArray(emitted)) return null;
  if (floor !== null && (typeof floor !== 'string' || secondOf(floor) !== floor)) return null;
  const entries = emitted.flatMap((entry): EmittedEntry[] =>
    odooInput.isRecord(entry) && typeof entry['id'] === 'number' && typeof entry['date'] === 'string' ? [{ id: entry['id'], date: entry['date'] }] : [],
  );
  return { date, floor, emitted: entries };
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

async function enabledAt({ store, reset = false }: { store: Store; reset?: boolean }): Promise<string> {
  const stored = await store.get<unknown>(ENABLED_AT_KEY);
  if (!reset && typeof stored === 'string' && secondOf(stored) === stored) return stored;
  const now = odooDates.toOdooDatetime(Date.now());
  await store.put(ENABLED_AT_KEY, now);
  return now;
}

async function onEnable({ client, source, store, isRepublish }: HookParams & { isRepublish?: boolean }): Promise<void> {
  if (isRepublish && readCursor(await store.get<unknown>(CURSOR_KEY))) return;
  await seed({ client, source, store });
}

async function onDisable({ store }: { store: Store }): Promise<void> {
  await store.delete(CURSOR_KEY);
  await store.delete(EMITTED_KEY);
  await store.delete(ENABLED_AT_KEY);
}

async function run({ client, source, store }: HookParams): Promise<Record<string, unknown>[]> {
  const cursor = readCursor(await store.get<unknown>(CURSOR_KEY));
  if (!cursor) {
    await seed({ client, source, store });
    return [];
  }
  const result = await pollAfter({ client, source, cursor });
  if (JSON.stringify(result.cursor) !== JSON.stringify(cursor)) await store.put(CURSOR_KEY, result.cursor);
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

function withArchived({ domain }: { domain: Domain }): Record<string, unknown> | undefined {
  const mentionsActive = domain.some((term) => Array.isArray(term) && (term[0] === 'active' || term[0].startsWith('active.')));
  return mentionsActive ? undefined : { active_test: false };
}

const CURSOR_KEY = 'odoo_poll_cursor';
const EMITTED_KEY = 'odoo_poll_emitted_ids';
const ENABLED_AT_KEY = 'odoo_poll_enabled_at';
const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const MAX_EMITTED = 2000;
const LOOK_BACK_SECONDS = 300;
const MAX_WINDOW_ENTRIES = 5000;
const EMPTY_CURSOR: PollCursor = { date: '1970-01-01 00:00:00', floor: null, emitted: [] };

export const odooPolling = {
  onEnable,
  onDisable,
  run,
  test,
  enabledAt,
  withArchived,
  pollAfter,
  newestCursor,
  unseenDomain,
  CURSOR_KEY,
  EMITTED_KEY,
  ENABLED_AT_KEY,
  MAX_EMITTED,
  LOOK_BACK_SECONDS,
  MAX_WINDOW_ENTRIES,
};

export type EmittedEntry = { id: number; date: string };

export type PollCursor = { date: string; floor: string | null; emitted: EmittedEntry[] };

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
