import {
  FlowluApiError,
  FlowluClient,
  FormValue,
  ListEnvelope,
} from './client';

async function latestId({
  client,
  source,
}: {
  client: FlowluClient;
  source: PollSource;
}): Promise<number> {
  const envelope = await client.list(source.module, source.entity, {
    'order_by[desc][]': 'id',
    limit: 1,
  });
  return maxId({ items: envelope.items, floor: 0 });
}

async function newSince({
  client,
  source,
  filters,
  checkpoint,
}: {
  client: FlowluClient;
  source: PollSource;
  filters: Record<string, FormValue>;
  checkpoint: number;
}): Promise<{ items: Record<string, unknown>[]; checkpoint: number }> {
  const snapshot = await latestId({ client, source });
  const first = await client.list(source.module, source.entity, {
    ...filters,
    'filter[id]': JSON.stringify({ type: 'more', value: checkpoint }),
    'order_by[asc][]': 'id',
    page: 1,
    limit: PAGE_SIZE,
  });
  const filterHonoured = !first.items.some((item) => idOf(item) <= checkpoint);
  const batch = filterHonoured
    ? await readFiltered({ client, source, filters, checkpoint, first })
    : await readUnfiltered({ client, source, filters, checkpoint, first });
  const items = batch.items
    .filter((item) => idOf(item) > checkpoint)
    .sort((a, b) => idOf(a) - idOf(b));
  const unique = items.filter(
    (item, index) => index === 0 || idOf(item) !== idOf(items[index - 1])
  );
  const lastEmitted = maxId({ items: unique, floor: checkpoint });
  return {
    items: unique,
    checkpoint: batch.complete ? Math.max(lastEmitted, snapshot) : lastEmitted,
  };
}

async function readFiltered({
  client,
  source,
  filters,
  checkpoint,
  first,
}: ReadInput): Promise<Batch> {
  const pages: Record<string, unknown>[][] = [first.items];
  let complete = first.items.length < PAGE_SIZE;
  for (let page = 2; !complete && page <= MAX_PAGES; page++) {
    const envelope = await client.list(source.module, source.entity, {
      ...filters,
      'filter[id]': JSON.stringify({ type: 'more', value: checkpoint }),
      'order_by[asc][]': 'id',
      page,
      limit: PAGE_SIZE,
    });
    pages.push(envelope.items);
    complete = envelope.items.length < PAGE_SIZE;
  }
  return { items: pages.flat(), complete };
}

async function readUnfiltered({
  client,
  source,
  filters,
  checkpoint,
  first,
}: ReadInput): Promise<Batch> {
  if (!isAscending(first.items)) {
    throw new FlowluApiError({
      message:
        'Flowlu ignored both the id filter and the sort order, so new records cannot be found reliably. Try again later.',
    });
  }
  const cache = new Map<number, Record<string, unknown>[]>([[1, first.items]]);
  const fetchPage = async (page: number) => {
    const cached = cache.get(page);
    if (cached !== undefined) {
      return cached;
    }
    const envelope = await client.list(source.module, source.entity, {
      ...filters,
      'order_by[asc][]': 'id',
      page,
      limit: PAGE_SIZE,
    });
    cache.set(page, envelope.items);
    return envelope.items;
  };
  const reachesNew = (items: Record<string, unknown>[]) =>
    items.length < PAGE_SIZE || idOf(items[items.length - 1]) > checkpoint;
  const start = await firstPageWith({ fetchPage, reachesNew });
  const pages: Record<string, unknown>[][] = [];
  let complete = false;
  for (let page = start; !complete && page < start + MAX_PAGES; page++) {
    const items = await fetchPage(page);
    pages.push(items);
    complete = items.length < PAGE_SIZE;
  }
  return { items: pages.flat(), complete };
}

async function firstPageWith({
  fetchPage,
  reachesNew,
}: {
  fetchPage: (page: number) => Promise<Record<string, unknown>[]>;
  reachesNew: (items: Record<string, unknown>[]) => boolean;
}): Promise<number> {
  if (reachesNew(await fetchPage(1))) {
    return 1;
  }
  let below = 1;
  let above = 2;
  while (!reachesNew(await fetchPage(above))) {
    below = above;
    above *= 2;
  }
  while (above - below > 1) {
    const middle = Math.floor((below + above) / 2);
    if (reachesNew(await fetchPage(middle))) {
      above = middle;
    } else {
      below = middle;
    }
  }
  return above;
}

async function latest({
  client,
  source,
  filters,
}: {
  client: FlowluClient;
  source: PollSource;
  filters: Record<string, FormValue>;
}): Promise<Record<string, unknown>[]> {
  const envelope = await client.list(source.module, source.entity, {
    ...filters,
    'order_by[desc][]': 'id',
    limit: TEST_ITEMS,
  });
  return envelope.items;
}

function isAscending(items: Record<string, unknown>[]): boolean {
  return items.every(
    (item, index) => index === 0 || idOf(items[index - 1]) <= idOf(item)
  );
}

function maxId({
  items,
  floor,
}: {
  items: Record<string, unknown>[];
  floor: number;
}): number {
  return items.reduce((max, item) => Math.max(max, idOf(item)), floor);
}

function idOf(item: Record<string, unknown>): number {
  const id = Number(item['id']);
  return Number.isFinite(id) ? id : 0;
}

export const flowluPolling = {
  latestId,
  newSince,
  latest,
  storeKey: 'flowlu_last_seen_id',
};

const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const TEST_ITEMS = 5;

export type PollSource = { module: string; entity: string };

type Batch = { items: Record<string, unknown>[]; complete: boolean };

type ReadInput = {
  client: FlowluClient;
  source: PollSource;
  filters: Record<string, FormValue>;
  checkpoint: number;
  first: ListEnvelope<Record<string, unknown>>;
};
