import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { NuelinkAuthValue, nuelinkAuths } from '../auth';
import { nuelinkClient } from '../common/client';
import { nuelinkInputs } from '../common/inputs';
import { nuelinkProps } from '../common/props';
import { nuelinkOutputSchemas } from '../output-schemas';

export const newPublishedPost = createTrigger({
  auth: nuelinkAuths,
  name: 'new_published_post',
  classification: 'READ',
  displayName: 'New Published Post',
  description: 'Fires when Nuelink publishes a post to a channel (or fails to, if you choose Failed). Runs once per channel.',
  aiMetadata: {
    description:
      'Fires once per channel delivery when Nuelink publishes a post (or fails to, if the Failed status is chosen); the payload is one channel result with its platform URL and the engagement counts at that moment. Checked by polling, so it can lag a few minutes.',
  },
  props: {
    brand: nuelinkProps.brand(),
    status: Property.StaticDropdown({
      displayName: 'Trigger On',
      required: true,
      defaultValue: 'PUBLISHED',
      options: {
        options: [
          { label: 'Published', value: 'PUBLISHED' },
          { label: 'Failed to publish', value: 'FAILED' },
        ],
      },
    }),
    collection: nuelinkProps.collection({ required: false, description: 'Only fire for posts from this collection. Leave empty for all collections.' }),
  },
  sampleData: {
    id: 120045,
    postId: 8801,
    collectionId: 77,
    channel: { id: 501, name: 'Acme on LinkedIn', type: 'LinkedIn' },
    postType: 'IMAGE',
    body: 'Our new product is live.',
    url: 'https://www.linkedin.com/feed/update/urn:li:share:123',
    status: 'PUBLISHED',
    message: null,
    publishedAt: '2026-10-10T14:00:00.000000Z',
    results: { likes: 42, comments: 5, shares: 3, views: 1200, saves: 18, engagement: 68, clicks: 27, impressions: 1540, reach: 1310 },
  },
  outputSchema: nuelinkOutputSchemas.newPublishedPost,
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const query = pollQuery({ auth: context.auth, propsValue: context.propsValue });
    if (context.isRepublish && isPollState(await context.store.get<unknown>(STORE_KEY))) {
      return;
    }
    await seed({ query, store: context.store });
  },
  async onDisable(context) {
    await context.store.delete(STORE_KEY);
  },
  async test(context) {
    const query = pollQuery({ auth: context.auth, propsValue: context.propsValue });
    const result = await nuelinkClient.getPage({
      apiKey: query.apiKey,
      path: ['brands', query.brandId, 'published-posts'],
      page: 1,
      perPage: TEST_SAMPLE_SIZE,
      query: { ...query.filters, sort_by: 'id', sort_order: 'desc' },
    });
    return result.items;
  },
  async run(context) {
    const query = pollQuery({ auth: context.auth, propsValue: context.propsValue });
    const state = await context.store.get<unknown>(STORE_KEY);
    if (!isPollState(state)) {
      await seed({ query, store: context.store });
      return [];
    }
    const startedAt = Date.now();
    const since = state.resume?.since ?? state.lastPoll - OVERLAP_MS;
    const firstPage = state.resume?.page ?? 1;
    const { items, truncated } = await collect({ query, since, firstPage });
    const recent = unpack({ groups: state.recent ?? [] });
    const seen = new Set([...state.seen, ...recent.map(([id]) => id)]);
    const fresh = uniqueById({ items }).filter((item) => !seen.has(idOf({ item })));
    const lastPoll = truncated ? state.lastPoll : startedAt;
    const nextState: PollState = {
      seen: [...fresh.map((item) => idOf({ item })).reverse(), ...state.seen].slice(0, SEEN_CAP),
      recent: keepRecent({ entries: [...recent, ...entriesOf({ items: fresh, fallback: startedAt })], floor: truncated ? since : lastPoll - OVERLAP_MS }),
      lastPoll,
      ...(truncated ? { resume: { since, page: firstPage + MAX_PAGES } } : {}),
    };
    await context.store.put<PollState>(STORE_KEY, nextState);
    return fresh;
  },
});

function pollQuery({ auth, propsValue }: { auth: NuelinkAuthValue | undefined; propsValue: Record<string, unknown> }): PollQuery {
  const apiKey = nuelinkClient.apiKeyOf({ auth });
  const brandId = nuelinkClient.numericId({ value: propsValue['brand'], label: 'Brand' });
  const status = nuelinkInputs.oneOf({ value: propsValue['status'], label: 'Trigger On', allowed: STATUSES }) ?? 'PUBLISHED';
  const collectionId = nuelinkInputs.optionalId({ value: propsValue['collection'], label: 'Collection' });
  return { apiKey, brandId, filters: { status, collection_id: collectionId } };
}

async function seed({ query, store }: { query: PollQuery; store: PollStore }): Promise<void> {
  const startedAt = Date.now();
  const { items } = await collect({ query, since: startedAt - OVERLAP_MS, firstPage: 1 });
  const unique = uniqueById({ items });
  const seen = unique
    .map((item) => idOf({ item }))
    .reverse()
    .slice(0, SEEN_CAP);
  const recent = keepRecent({ entries: entriesOf({ items: unique, fallback: startedAt }), floor: startedAt - OVERLAP_MS });
  await store.put<PollState>(STORE_KEY, { seen, recent, lastPoll: startedAt });
}

async function collect({ query, since, firstPage }: { query: PollQuery; since: number; firstPage: number }): Promise<{ items: Record<string, unknown>[]; truncated: boolean }> {
  const publishedFrom = new Date(since).toISOString().slice(0, 19).replace('T', ' ');
  const pages: Record<string, unknown>[][] = [];
  for (let page = firstPage; page < firstPage + MAX_PAGES; page++) {
    const result = await nuelinkClient.getPage({
      apiKey: query.apiKey,
      path: ['brands', query.brandId, 'published-posts'],
      page,
      perPage: PAGE_SIZE,
      query: { ...query.filters, published_from: publishedFrom, sort_by: 'id', sort_order: 'asc' },
    });
    pages.push(result.items);
    if (!result.hasMore) {
      return { items: pages.flat(), truncated: false };
    }
  }
  return { items: pages.flat(), truncated: true };
}

function uniqueById({ items }: { items: Record<string, unknown>[] }): Record<string, unknown>[] {
  const byId = new Map<string, Record<string, unknown>>();
  for (const item of items) {
    const id = idOf({ item });
    if (id.length > 0 && !byId.has(id)) {
      byId.set(id, item);
    }
  }
  return [...byId.values()];
}

function idOf({ item }: { item: Record<string, unknown> }): string {
  const id = item['id'];
  return typeof id === 'number' || typeof id === 'string' ? String(id) : '';
}

function entriesOf({ items, fallback }: { items: Record<string, unknown>[]; fallback: number }): RecentEntry[] {
  return items.map((item) => {
    const value = item['publishedAt'];
    const time = typeof value === 'string' ? Date.parse(value) : Number.NaN;
    return [idOf({ item }), Number.isFinite(time) ? time : fallback];
  });
}

function keepRecent({ entries, floor }: { entries: RecentEntry[]; floor: number }): RecentGroup[] {
  const kept = withinBudget({ entries: entries.filter(([, time]) => time >= floor).slice(-RECENT_CAP) });
  const byTime = new Map<number, string[]>();
  for (const [id, time] of kept) {
    const ids = byTime.get(time);
    if (ids === undefined) {
      byTime.set(time, [id]);
    } else {
      ids.push(id);
    }
  }
  return [...byTime.entries()];
}

function withinBudget({ entries }: { entries: RecentEntry[] }): RecentEntry[] {
  const times = new Set<number>();
  let bytes = 0;
  for (let index = entries.length - 1; index >= 0; index--) {
    const [id, time] = entries[index];
    const cost = id.length + 3 + (times.has(time) ? 0 : String(time).length + 6);
    if (bytes + cost > RECENT_BYTE_BUDGET) {
      return entries.slice(index + 1);
    }
    bytes += cost;
    times.add(time);
  }
  return entries;
}

function unpack({ groups }: { groups: RecentGroup[] }): RecentEntry[] {
  return groups.flatMap(([time, ids]) => ids.map((id): RecentEntry => [id, time]));
}

function isPollState(value: unknown): value is PollState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const seen = Reflect.get(value, 'seen');
  const lastPoll = Reflect.get(value, 'lastPoll');
  const resume = Reflect.get(value, 'resume');
  const recent = Reflect.get(value, 'recent');
  return (
    Array.isArray(seen) &&
    seen.every((id: unknown) => typeof id === 'string') &&
    typeof lastPoll === 'number' &&
    Number.isFinite(lastPoll) &&
    (resume === undefined || isResumePoint(resume)) &&
    (recent === undefined || (Array.isArray(recent) && recent.every(isRecentGroup)))
  );
}

function isRecentGroup(value: unknown): value is RecentGroup {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && Number.isFinite(value[0]) && Array.isArray(value[1]) && value[1].every((id: unknown) => typeof id === 'string');
}

function isResumePoint(value: unknown): value is ResumePoint {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const since = Reflect.get(value, 'since');
  const page = Reflect.get(value, 'page');
  return typeof since === 'number' && Number.isFinite(since) && typeof page === 'number' && Number.isInteger(page) && page > 1;
}

const STORE_KEY = 'nuelink_new_published_post';
const OVERLAP_MS = 15 * 60 * 1000;
const MAX_PAGES = 5;
const PAGE_SIZE = 100;
const SEEN_CAP = 1000;
const RECENT_CAP = 20000;
const RECENT_BYTE_BUDGET = 400 * 1024;
const TEST_SAMPLE_SIZE = 5;
const STATUSES = ['PUBLISHED', 'FAILED'] as const;

type PollState = {
  seen: string[];
  recent?: RecentGroup[];
  lastPoll: number;
  resume?: ResumePoint;
};

type RecentEntry = [string, number];

type RecentGroup = [number, string[]];

type ResumePoint = {
  since: number;
  page: number;
};

type PollQuery = {
  apiKey: string;
  brandId: string;
  filters: Record<string, string | undefined>;
};

type PollStore = {
  put: <T>(key: string, value: T) => Promise<T>;
};
