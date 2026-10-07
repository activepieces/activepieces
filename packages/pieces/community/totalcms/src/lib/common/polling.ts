import { Store } from '@activepieces/pieces-framework';
import { totalcmsApi, totalcmsHelpers, TotalCmsConnection } from './client';

const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const MAX_START_PAGES = 50;
const TEST_ITEMS = 5;
const STORE_KEY = 'totalcms_checkpoint';

export const totalcmsPolling = {
  enable,
  disable,
  poll,
  sample,
};

async function enable({ auth, store, collection, field, isRepublish }: PollParams & { isRepublish?: boolean }): Promise<void> {
  await assertTimestampField({ auth, collection, field });
  if (isRepublish && (await readCheckpoint({ store })) !== null) {
    return;
  }
  const newest = await collectNewestGroup({ auth, collection, field });
  await store.put(STORE_KEY, checkpointFrom({ objects: newest, field, previous: { ts: 0, ids: [] } }));
}

async function disable({ store }: { store: Store }): Promise<void> {
  await store.delete(STORE_KEY);
}

async function poll({ auth, store, collection, field }: PollParams): Promise<Record<string, unknown>[]> {
  const checkpoint = await readCheckpoint({ store });
  if (checkpoint === null) {
    await enable({ auth, store, collection, field });
    return [];
  }
  const fresh = await collectSince({ auth, collection, field, checkpoint });
  const objects = await loadFull({ auth, collection, items: [...fresh].reverse() });
  await store.put(STORE_KEY, checkpointFrom({ objects: fresh, field, previous: checkpoint }));
  return objects;
}

async function sample({ auth, collection, field, keep }: Omit<PollParams, 'store'> & { keep: (object: Record<string, unknown>) => boolean }): Promise<Record<string, unknown>[]> {
  await assertTimestampField({ auth, collection, field });
  const page = await totalcmsApi.queryObjects({ auth, collection, limit: PAGE_SIZE, offset: 0, sort: `-${field}` });
  const objects = await loadFull({ auth, collection, items: page.objects.slice(0, TEST_ITEMS * 4) });
  return objects.filter(keep).slice(0, TEST_ITEMS);
}

async function collectSince({
  auth,
  collection,
  field,
  checkpoint,
}: {
  auth: TotalCmsConnection;
  collection: string;
  field: string;
  checkpoint: Checkpoint;
}): Promise<Record<string, unknown>[]> {
  const pages: Record<string, unknown>[][] = [];
  for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex++) {
    const page = await totalcmsApi.queryObjects({
      auth,
      collection,
      limit: PAGE_SIZE,
      offset: pageIndex * PAGE_SIZE,
      sort: `-${field}`,
    });
    const newer = page.objects.filter((item) => isNewer({ item, field, checkpoint }));
    pages.push(newer);
    const reachedCheckpoint = page.objects.some((item) => timestampOf({ item, field }) < checkpoint.ts);
    if (reachedCheckpoint || page.objects.length < PAGE_SIZE) {
      break;
    }
  }
  return pages.flat();
}

async function collectNewestGroup({
  auth,
  collection,
  field,
}: {
  auth: TotalCmsConnection;
  collection: string;
  field: string;
}): Promise<Record<string, unknown>[]> {
  const collected: Record<string, unknown>[] = [];
  for (let pageIndex = 0; pageIndex < MAX_START_PAGES; pageIndex++) {
    const page = await totalcmsApi.queryObjects({
      auth,
      collection,
      limit: PAGE_SIZE,
      offset: pageIndex * PAGE_SIZE,
      sort: `-${field}`,
    });
    collected.push(...page.objects);
    const newest = collected.map((item) => timestampOf({ item, field })).find((ts) => !Number.isNaN(ts));
    const reachedOlder = newest !== undefined && page.objects.some((item) => timestampOf({ item, field }) < newest);
    if (reachedOlder || page.objects.length < PAGE_SIZE) {
      return collected;
    }
  }
  const next = await totalcmsApi.queryObjects({
    auth,
    collection,
    limit: 1,
    offset: MAX_START_PAGES * PAGE_SIZE,
    sort: `-${field}`,
  });
  const newestTs = collected.map((item) => timestampOf({ item, field })).find((ts) => !Number.isNaN(ts));
  const groupContinues = next.objects.some((item) => timestampOf({ item, field }) === newestTs);
  if (!groupContinues) {
    return collected;
  }
  throw new Error(
    `More than ${MAX_START_PAGES * PAGE_SIZE} objects in collection "${collection}" share the newest "${field}" date, so Activepieces cannot tell which ones already exist. Try again after newer objects are added.`,
  );
}

function isNewer({ item, field, checkpoint }: { item: Record<string, unknown>; field: string; checkpoint: Checkpoint }): boolean {
  const ts = timestampOf({ item, field });
  if (Number.isNaN(ts) || ts < checkpoint.ts) {
    return false;
  }
  if (ts === checkpoint.ts) {
    return !checkpoint.ids.includes(String(item['id']));
  }
  return true;
}

function checkpointFrom({ objects, field, previous }: { objects: Record<string, unknown>[]; field: string; previous: Checkpoint }): Checkpoint {
  const stamps = objects.map((item) => timestampOf({ item, field })).filter((ts) => !Number.isNaN(ts));
  if (stamps.length === 0) {
    return previous;
  }
  const newest = stamps.reduce((max, ts) => (ts > max ? ts : max), previous.ts);
  const idsAtNewest = objects.filter((item) => timestampOf({ item, field }) === newest).map((item) => String(item['id']));
  const ids = newest === previous.ts ? [...new Set([...previous.ids, ...idsAtNewest])] : idsAtNewest;
  return { ts: newest, ids };
}

function timestampOf({ item, field }: { item: Record<string, unknown>; field: string }): number {
  const value = item[field];
  return typeof value === 'string' ? Date.parse(value) : NaN;
}

async function loadFull({ auth, collection, items }: { auth: TotalCmsConnection; collection: string; items: Record<string, unknown>[] }): Promise<Record<string, unknown>[]> {
  const loaded: Record<string, unknown>[] = [];
  for (const item of items) {
    const id = String(item['id'] ?? '');
    if (!id) {
      continue;
    }
    const full = await totalcmsApi.findObject({ auth, collection, id });
    if (full) {
      loaded.push({ collection, ...full });
    }
  }
  return loaded;
}

async function assertTimestampField({ auth, collection, field }: { auth: TotalCmsConnection; collection: string; field: string }): Promise<void> {
  const schema = await totalcmsApi.getSchema({ auth, collection });
  const index = Array.isArray(schema['index']) ? schema['index'] : [];
  const properties = totalcmsHelpers.isRecord(schema['properties']) ? schema['properties'] : {};
  if (!(field in properties) || !index.includes(field)) {
    throw new Error(
      `Collection "${collection}" does not record a "${field}" date for its objects, so Activepieces cannot tell when objects are ${field === 'created' ? 'added' : 'changed'}. Add a "${field}" datetime field to its schema (and to the schema index), or pick another collection.`,
    );
  }
}

async function readCheckpoint({ store }: { store: Store }): Promise<Checkpoint | null> {
  const value = await store.get<unknown>(STORE_KEY);
  if (!totalcmsHelpers.isRecord(value) || typeof value['ts'] !== 'number' || !Array.isArray(value['ids'])) {
    return null;
  }
  return { ts: value['ts'], ids: value['ids'].map(String) };
}

type Checkpoint = { ts: number; ids: string[] };

type PollParams = { auth: TotalCmsConnection; store: Store; collection: string; field: 'created' | 'updated' };
