import { DynamicsCRMClient } from './client';
import { odata } from './odata';

const STATE_KEY = 'dynamics_poll_state';
const PAGE_SIZE = 500;
const MAX_EMITTED_PER_POLL = 1000;
const MAX_SCANNED_PER_POLL = 20000;
const EPOCH = '1970-01-01T00:00:00Z';
const TEST_LIMIT = 5;
const LOOKBACK_MS = 60000;
const MAX_SEEN_KEYS = 5000;
const MAX_PAGES_PER_POLL = 100;

function toMillis(value: unknown): number | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const millis = Date.parse(value);
  return Number.isNaN(millis) ? undefined : millis;
}

function readState({ value, config }: { value: unknown; config: PollConfig }): PollState | undefined {
  if (!odata.isRecord(value) || value['entitySet'] !== config.entitySet || value['column'] !== config.column) {
    return undefined;
  }
  const watermark = value['watermark'];
  const watermarkMillis = toMillis(watermark);
  if (typeof watermark !== 'string' || watermarkMillis === undefined) {
    return undefined;
  }
  const seen = value['seen'];
  const windowStart = value['windowStart'];
  if (Array.isArray(seen) && seen.every((key) => typeof key === 'string') && typeof windowStart === 'number') {
    return { entitySet: config.entitySet, column: config.column, watermark, windowStart, seen };
  }
  const legacyIds = value['idsAtWatermark'];
  if (Array.isArray(legacyIds) && legacyIds.every((id) => typeof id === 'string')) {
    return {
      entitySet: config.entitySet,
      column: config.column,
      watermark,
      windowStart: watermarkMillis,
      seen: legacyIds.map((id) => seenKey({ id, millis: watermarkMillis })),
    };
  }
  return undefined;
}

function seenKey({ id, millis }: { id: string; millis: number }): string {
  return `${id}|${millis}`;
}

function keyMillis(key: string): number {
  return Number(key.slice(key.lastIndexOf('|') + 1));
}

function isoSeconds(millis: number): string {
  return new Date(Math.floor(millis / 1000) * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

async function initialState({ client, config }: { client: DynamicsCRMClient; config: PollConfig }): Promise<PollState> {
  const latest = await client.listRecords({
    entitySet: config.entitySet,
    select: [config.primaryId, config.column],
    orderby: `${config.column} desc,${config.primaryId} desc`,
    pageSize: 1,
  });
  const top = latest.records[0];
  const topMillis = top ? toMillis(top[config.column]) : undefined;
  if (!top || topMillis === undefined) {
    return { entitySet: config.entitySet, column: config.column, watermark: EPOCH, windowStart: 0, seen: [] };
  }
  const watermark = String(top[config.column]);
  const seen: string[] = [];
  let nextLink: string | undefined;
  let pages = 0;
  do {
    const page = await client.listRecords({
      entitySet: config.entitySet,
      select: [config.primaryId],
      filter: `${config.column} eq ${isoSeconds(topMillis)}`,
      pageSize: PAGE_SIZE,
      nextLink,
    });
    for (const record of page.records) {
      const id = record[config.primaryId];
      if (typeof id === 'string') {
        seen.push(seenKey({ id, millis: topMillis }));
      }
    }
    nextLink = page.nextLink ?? undefined;
    pages += 1;
  } while (nextLink !== undefined && pages < MAX_PAGES_PER_POLL);
  return { entitySet: config.entitySet, column: config.column, watermark, windowStart: topMillis, seen };
}

async function onEnable({ client, store, config, isRepublish }: EnableParams): Promise<void> {
  const existing = readState({ value: await store.get(STATE_KEY), config });
  if (isRepublish && existing !== undefined) {
    return;
  }
  await store.put(STATE_KEY, await initialState({ client, config }));
}

async function onDisable({ store }: { store: PollStore }): Promise<void> {
  await store.delete(STATE_KEY);
}

async function poll({ client, store, config }: PollParams): Promise<Record<string, unknown>[]> {
  const state = readState({ value: await store.get(STATE_KEY), config }) ?? (await initialState({ client, config }));
  const result = await scan({ client, config, state });
  await store.put(STATE_KEY, result.state);
  return result.items.map((record) => shapeOutput({ record, config }));
}

function nextState({ state, watermark, watermarkMillis, seen }: NextStateParams): PollState {
  const lowerBound = Math.max(state.windowStart, watermarkMillis - LOOKBACK_MS);
  const inWindow = [...seen].filter((key) => keyMillis(key) >= lowerBound);
  if (inWindow.length <= MAX_SEEN_KEYS) {
    return { ...state, watermark, windowStart: lowerBound, seen: inWindow };
  }
  const counts = new Map<number, number>();
  for (const key of inWindow) {
    const millis = keyMillis(key);
    counts.set(millis, (counts.get(millis) ?? 0) + 1);
  }
  const groups = [...counts.keys()].sort((a, b) => b - a);
  let kept = 0;
  let windowStart = watermarkMillis;
  for (const millis of groups) {
    const size = counts.get(millis) ?? 0;
    if (millis !== watermarkMillis && kept + size > MAX_SEEN_KEYS) {
      break;
    }
    kept += size;
    windowStart = millis;
  }
  return { ...state, watermark, windowStart, seen: inWindow.filter((key) => keyMillis(key) >= windowStart) };
}

async function scan({ client, config, state }: ScanParams): Promise<{ items: Record<string, unknown>[]; state: PollState }> {
  const seen = new Set(state.seen);
  const items: Record<string, unknown>[] = [];
  let watermark = state.watermark;
  let watermarkMillis = toMillis(state.watermark) ?? 0;
  let fresh = 0;
  let pages = 0;
  let nextLink: string | undefined;
  do {
    const page = await client.listRecords({
      entitySet: config.entitySet,
      filter: `${config.column} ge ${isoSeconds(state.windowStart)}`,
      orderby: `${config.column} asc,${config.primaryId} asc`,
      pageSize: PAGE_SIZE,
      nextLink,
      formatted: true,
    });
    pages += 1;
    for (const record of page.records) {
      const id = record[config.primaryId];
      const millis = toMillis(record[config.column]);
      if (typeof id !== 'string' || millis === undefined) {
        continue;
      }
      const capped = items.length >= MAX_EMITTED_PER_POLL || fresh >= MAX_SCANNED_PER_POLL;
      if (capped && millis > watermarkMillis) {
        return { items, state: nextState({ state, watermark, watermarkMillis, seen }) };
      }
      const key = seenKey({ id, millis });
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      fresh += 1;
      if (millis > watermarkMillis) {
        watermarkMillis = millis;
        watermark = String(record[config.column]);
      }
      if (!config.include || config.include(record)) {
        items.push(record);
      }
    }
    nextLink = page.nextLink ?? undefined;
    if (nextLink !== undefined && pages >= MAX_PAGES_PER_POLL) {
      throw new Error(
        `More than ${MAX_PAGES_PER_POLL * PAGE_SIZE} ${config.entitySet} records share one ${config.column} time window; the trigger stopped instead of skipping records.`
      );
    }
  } while (nextLink !== undefined);
  return { items, state: nextState({ state, watermark, watermarkMillis, seen }) };
}

async function test({ client, config }: { client: DynamicsCRMClient; config: PollConfig }): Promise<Record<string, unknown>[]> {
  const page = await client.listRecords({
    entitySet: config.entitySet,
    orderby: `${config.column} desc`,
    pageSize: config.include ? 50 : TEST_LIMIT,
    formatted: true,
  });
  const records = config.include ? page.records.filter(config.include) : page.records;
  return records.slice(0, TEST_LIMIT).map((record) => shapeOutput({ record, config }));
}

function shapeOutput({ record, config }: { record: Record<string, unknown>; config: PollConfig }): Record<string, unknown> {
  return odata.shapeRecord({
    record,
    keys: config.outputKeys ?? [],
    primaryId: config.addIdentity ? config.primaryId : undefined,
    entitySet: config.addIdentity ? config.entitySet : undefined,
  });
}

function changedAfterCreate(record: Record<string, unknown>): boolean {
  return record['createdon'] !== record['modifiedon'];
}

type PollState = {
  entitySet: string;
  column: string;
  watermark: string;
  windowStart: number;
  seen: string[];
};

type NextStateParams = {
  state: PollState;
  watermark: string;
  watermarkMillis: number;
  seen: Set<string>;
};

type PollConfig = {
  entitySet: string;
  primaryId: string;
  column: 'createdon' | 'modifiedon';
  include?: (record: Record<string, unknown>) => boolean;
  outputKeys?: string[];
  addIdentity?: boolean;
};

type PollStore = {
  get(key: string): Promise<unknown>;
  put(key: string, value: PollState): Promise<unknown>;
  delete(key: string): Promise<void>;
};

type EnableParams = {
  client: DynamicsCRMClient;
  store: PollStore;
  config: PollConfig;
  isRepublish?: boolean;
};

type PollParams = {
  client: DynamicsCRMClient;
  store: PollStore;
  config: PollConfig;
};

type ScanParams = {
  client: DynamicsCRMClient;
  config: PollConfig;
  state: PollState;
};

export const dynamicsPolling = {
  onEnable,
  onDisable,
  poll,
  scan,
  test,
  changedAfterCreate,
  STATE_KEY,
  MAX_EMITTED_PER_POLL,
  MAX_SCANNED_PER_POLL,
  LOOKBACK_MS,
  MAX_SEEN_KEYS,
};

export type { PollConfig, PollState, PollStore };
