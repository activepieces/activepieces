import { Store } from '@activepieces/pieces-framework';
import { OdooClient, OdooFieldMap } from './client';
import { odooRecords } from './records';
import { Domain, odooDates, odooDomain, odooInput, odooOutput } from './values';

async function newestCursor({ client, source }: { client: OdooClient; source: PollSource }): Promise<PollCursor> {
  const modelWide = { ...source, domain: [] };
  const newest = await newestInModel({ client, source });
  return newest ? cursorAt({ client, source: modelWide, date: newest.date }) : EMPTY_CURSOR;
}

async function newestInModel({ client, source }: { client: OdooClient; source: PollSource }): Promise<RowKey | null> {
  return newestRow({ client, source: { ...source, domain: [] }, domain: [[source.dateField, '!=', false]] });
}

async function cursorAt({ client, source, date }: { client: OdooClient; source: PollSource; date: string }): Promise<PollCursor> {
  const ranges = await rangesInSecond({ client, source, date });
  if (ranges === null) return { date, floor: { date, id: await maxIdInSecond({ client, source, date }) }, emitted: [] };
  const before = await newestRow({ client, source, domain: [[source.dateField, '<', date]] });
  return { date, floor: before, emitted: [{ date, ranges }] };
}

async function newestRow({ client, source, domain }: { client: OdooClient; source: PollSource; domain: Domain }): Promise<RowKey | null> {
  const rows = await client.call<Record<string, unknown>[]>({
    model: source.model,
    method: 'search_read',
    args: [odooDomain.andDomains([source.domain, domain])],
    kwargs: { fields: ['id', source.dateField], order: `${source.dateField} desc, id desc`, limit: 1, context: source.context },
  });
  const row = Array.isArray(rows) ? rows[0] : undefined;
  const [key] = row ? keyOf({ row, dateField: source.dateField }) : [];
  return key ?? null;
}

async function rangesInSecond({ client, source, date }: { client: OdooClient; source: PollSource; date: string }): Promise<IdRange[] | null> {
  let ranges: IdRange[] = [];
  let after = 0;
  for (let page = 0; page < SEED_MAX_PAGES; page++) {
    const ids = readIds(
      await client.call<number[]>({
        model: source.model,
        method: 'search',
        args: [odooDomain.andDomains([source.domain, secondDomain({ dateField: source.dateField, date }), [['id', '>', after]]])],
        kwargs: { order: 'id asc', limit: SEED_PAGE_SIZE, context: source.context },
      }),
    );
    ranges = addIds({ ranges, ids });
    if (ranges.length > MAX_WINDOW_RANGES) return null;
    if (ids.length < SEED_PAGE_SIZE) return ranges;
    after = Math.max(after, ...ids);
  }
  return null;
}

async function maxIdInSecond({ client, source, date }: { client: OdooClient; source: PollSource; date: string }): Promise<number> {
  const ids = await client.call<number[]>({
    model: source.model,
    method: 'search',
    args: [odooDomain.andDomains([source.domain, secondDomain({ dateField: source.dateField, date })])],
    kwargs: { order: 'id desc', limit: 1, context: source.context },
  });
  return readIds(ids)[0] ?? 0;
}

function secondDomain({ dateField, date }: { dateField: string; date: string }): Domain {
  return [[dateField, '>=', date], [dateField, '<', shiftSeconds({ date, seconds: 1 })]];
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

function keyOf({ row, dateField }: { row: Record<string, unknown>; dateField: string }): RowKey[] {
  const id = row['id'];
  const date = secondOf(row[dateField]);
  return typeof id === 'number' && date !== null ? [{ id, date }] : [];
}

function addIds({ ranges, ids }: { ranges: IdRange[]; ids: number[] }): IdRange[] {
  const sorted = [...ranges, ...ids.map((id): IdRange => [id, id])].sort((a, b) => a[0] - b[0]);
  const merged: IdRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1] + 1) merged[merged.length - 1] = [last[0], Math.max(last[1], range[1])];
    else merged.push(range);
  }
  return merged;
}

function remember({ emitted, keys }: { emitted: EmittedSecond[]; keys: RowKey[] }): EmittedSecond[] {
  const bySecond = new Map(emitted.map((second): [string, IdRange[]] => [second.date, second.ranges]));
  for (const date of new Set(keys.map((key) => key.date))) {
    const ids = keys.filter((key) => key.date === date).map((key) => key.id);
    bySecond.set(date, addIds({ ranges: bySecond.get(date) ?? [], ids }));
  }
  return [...bySecond.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([date, ranges]) => ({ date, ranges }));
}

function countRanges(emitted: EmittedSecond[]): number {
  return emitted.reduce((total, second) => total + second.ranges.length, 0);
}

function isAfter({ entry, than }: { entry: RowKey; than: RowKey }): boolean {
  return entry.date === than.date ? entry.id > than.id : entry.date > than.date;
}

function startDomain({ dateField, cursor }: { dateField: string; cursor: PollCursor }): Domain {
  const lookBack = shiftSeconds({ date: cursor.date, seconds: -LOOK_BACK_SECONDS });
  const floor = cursor.floor;
  if (floor === null || floor.date < lookBack) return [[dateField, '>=', lookBack]];
  return ['|', [dateField, '>=', shiftSeconds({ date: floor.date, seconds: 1 })], '&', [dateField, '>=', floor.date], ['id', '>', floor.id]];
}

function outsideRanges(ranges: IdRange[]): Domain {
  const singles = ranges.filter(([from, to]) => from === to).map(([from]) => from);
  const spans = ranges.filter(([from, to]) => from !== to);
  return odooDomain.andDomains([
    singles.length > 0 ? [['id', 'not in', singles]] : [],
    ...spans.map(([from, to]): Domain => ['|', ['id', '<', from], ['id', '>', to]]),
  ]);
}

function unseenDomain({ dateField, cursor }: { dateField: string; cursor: PollCursor }): Domain {
  const exclusions = cursor.emitted
    .filter((second) => second.ranges.length > 0)
    .map((second): Domain => [
      '|',
      '|',
      [dateField, '<', second.date],
      [dateField, '>=', shiftSeconds({ date: second.date, seconds: 1 })],
      ...outsideRanges(second.ranges),
    ]);
  return odooDomain.andDomains([startDomain({ dateField, cursor }), ...exclusions]);
}

function isEmitted({ row, cursor, dateField }: { row: Record<string, unknown>; cursor: PollCursor; dateField: string }): boolean {
  const [key] = keyOf({ row, dateField });
  if (key === undefined) return true;
  return cursor.emitted.some((second) => second.date === key.date && second.ranges.some(([from, to]) => key.id >= from && key.id <= to));
}

function settle(cursor: PollCursor): PollCursor {
  const lookBack = shiftSeconds({ date: cursor.date, seconds: -LOOK_BACK_SECONDS });
  const inWindow = cursor.emitted.filter((second) => second.date >= lookBack);
  let excess = Math.max(0, countRanges(inWindow) - MAX_WINDOW_RANGES);
  let dropped: RowKey | null = null;
  const kept: EmittedSecond[] = [];
  for (const second of inWindow) {
    const drop = Math.min(excess, second.ranges.length);
    if (drop > 0) dropped = { date: second.date, id: second.ranges[drop - 1][1] };
    excess -= drop;
    if (drop < second.ranges.length) kept.push({ date: second.date, ranges: second.ranges.slice(drop) });
  }
  const floors = [cursor.floor, dropped].filter((floor): floor is RowKey => floor !== null && floor.date >= lookBack);
  const floor = floors.length > 0 ? floors.reduce((a, b) => (isAfter({ entry: a, than: b }) ? a : b)) : null;
  const emitted = floor === null ? kept : aboveFloor({ emitted: kept, floor });
  return { date: cursor.date, floor, emitted };
}

function aboveFloor({ emitted, floor }: { emitted: EmittedSecond[]; floor: RowKey }): EmittedSecond[] {
  return emitted
    .filter((second) => second.date >= floor.date)
    .map((second) => (second.date === floor.date ? { date: second.date, ranges: second.ranges.filter(([, to]) => to > floor.id) } : second))
    .filter((second) => second.ranges.length > 0);
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
  let pending: string | null = null;
  let drained = false;
  const take = (rows: Record<string, unknown>[]): number => {
    const seen = current;
    const fresh = rows.filter((row) => !isEmitted({ row, cursor: seen, dateField: source.dateField }));
    for (const row of fresh) {
      collected.push(pad({ record: odooOutput.normalizeRecord({ record: row, fields: map, requested: names }), source }));
    }
    const keys = fresh.flatMap((row) => keyOf({ row, dateField: source.dateField }));
    const newest = keys.reduce((max, key) => (key.date > max ? key.date : max), current.date);
    current = { date: newest, floor: current.floor, emitted: remember({ emitted: current.emitted, keys }) };
    return fresh.length;
  };
  for (let page = 0; page < maxPages; page++) {
    if (pending === null) {
      const list = await readUnseen({ client, source, cursor: current, names, limit: pageSize, second: null });
      const last = list.length < pageSize ? null : secondOf(list[list.length - 1][source.dateField]);
      const complete = last === null ? list : list.filter((row) => secondOf(row[source.dateField]) !== last);
      if (take(complete) === 0 && complete.length > 0) break;
      if (list.length < pageSize) {
        drained = true;
        break;
      }
      if (last === null) continue;
      pending = last;
    }
    const rows = await readUnseen({ client, source, cursor: current, names, limit: pageSize, second: pending });
    if (take(rows) === 0 && rows.length > 0) break;
    if (rows.length < pageSize) pending = null;
  }
  const newest = drained ? await newestInModel({ client, source }) : null;
  const caughtUp = newest !== null && newest.date > current.date ? { ...current, date: newest.date } : current;
  return { records: collected, cursor: settle(caughtUp) };
}

async function readUnseen({
  client,
  source,
  cursor,
  names,
  limit,
  second,
}: {
  client: OdooClient;
  source: PollSource;
  cursor: PollCursor;
  names: string[];
  limit: number;
  second: string | null;
}): Promise<Record<string, unknown>[]> {
  const rows = await client.call<Record<string, unknown>[]>({
    model: source.model,
    method: 'search_read',
    args: [
      odooDomain.andDomains([
        source.domain,
        unseenDomain({ dateField: source.dateField, cursor }),
        second === null ? [] : secondDomain({ dateField: source.dateField, date: second }),
      ]),
    ],
    kwargs: { fields: names, order: second === null ? `${source.dateField} asc, id asc` : 'id asc', limit, context: source.context },
  });
  return Array.isArray(rows) ? rows : [];
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
  const emitted = value['emitted'];
  if (typeof date !== 'string' || secondOf(date) !== date || !Array.isArray(emitted)) return null;
  const floor = readFloor(value['floor']);
  if (floor === undefined) return null;
  const seconds = emitted.map(readSecond);
  if (seconds.some((second) => second === null)) return null;
  return { date, floor, emitted: seconds.filter((second): second is EmittedSecond => second !== null) };
}

function readFloor(value: unknown): RowKey | null | undefined {
  if (value === null) return null;
  if (!odooInput.isRecord(value)) return undefined;
  const date = value['date'];
  const id = value['id'];
  return typeof date === 'string' && secondOf(date) === date && typeof id === 'number' && Number.isInteger(id) ? { date, id } : undefined;
}

function readSecond(value: unknown): EmittedSecond | null {
  if (!odooInput.isRecord(value)) return null;
  const date = value['date'];
  const ranges = value['ranges'];
  if (typeof date !== 'string' || secondOf(date) !== date || !Array.isArray(ranges)) return null;
  const valid = ranges.flatMap((range): IdRange[] => {
    if (!Array.isArray(range) || range.length !== 2) return [];
    const [from, to] = range;
    return typeof from === 'number' && typeof to === 'number' && Number.isInteger(from) && Number.isInteger(to) && from <= to ? [[from, to]] : [];
  });
  return valid.length === ranges.length ? { date, ranges: valid } : null;
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
  const fresh = result.records.filter((record) => {
    const id = record['id'];
    if (typeof id !== 'number') return true;
    if (done.has(id)) return false;
    done.add(id);
    return true;
  });
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
const MAX_WINDOW_RANGES = 5000;
const SEED_PAGE_SIZE = 5000;
const SEED_MAX_PAGES = 20;
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
  MAX_WINDOW_RANGES,
  SEED_PAGE_SIZE,
};

export type IdRange = [number, number];

export type EmittedSecond = { date: string; ranges: IdRange[] };

export type RowKey = { date: string; id: number };

export type PollCursor = { date: string; floor: RowKey | null; emitted: EmittedSecond[] };

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
