import { createTrigger, isNil, TriggerStrategy } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { wordpressAuth } from '../..';
import { wordpressCommon } from '../common';
import { wordpressApi, WordpressApiError, WordpressAuthValue } from '../common/client';
import { newPostTriggerOutputSchema } from '../output-schemas';

export const wordpressNewPost = createTrigger({
  auth: wordpressAuth,
  name: 'new_post',
  classification: 'READ',
  displayName: 'New Post',
  outputSchema: newPostTriggerOutputSchema,
  sampleData: {
    id: 60,
    date: '2023-02-19T10:08:25',
    date_gmt: '2023-02-19T10:08:25',
    guid: {
      rendered: 'https://yoursite.com/?p=60',
    },
    modified: '2023-02-19T10:08:25',
    modified_gmt: '2023-02-19T10:08:25',
    slug: 'post-slug',
    status: 'publish',
    type: 'post',
    link: '/post-slug/',
    title: {
      rendered: '<h1> post title </h1>',
    },
    content: {
      rendered: '\npost content\n',
      protected: false,
    },
    excerpt: {
      rendered: 'xxx\n',
      protected: false,
    },
    author: 1,
    featured_media: 0,
    comment_status: 'open',
    ping_status: 'open',
    sticky: false,
    template: '',
    format: 'standard',
    meta: [],
    categories: [1],
    tags: [],
    _links: {
      self: [
        {
          href: '/wp-json/wp/v2/posts/60',
        },
      ],
      collection: [
        {
          href: '/wp-json/wp/v2/posts',
        },
      ],
      about: [
        {
          href: '/wp-json/wp/v2/types/post',
        },
      ],
      author: [
        {
          embeddable: true,
          href: '/wp-json/wp/v2/users/1',
        },
      ],
      replies: [
        {
          embeddable: true,
          href: '/wp-json/wp/v2/comments?post=60',
        },
      ],
      'version-history': [
        {
          count: 1,
          href: '/wp-json/wp/v2/posts/60/revisions',
        },
      ],
      'predecessor-version': [
        {
          id: 61,
          href: '/wp-json/wp/v2/posts/60/revisions/61',
        },
      ],
      'wp:attachment': [
        {
          href: '/wp-json/wp/v2/media?parent=60',
        },
      ],
      'wp:term': [
        {
          taxonomy: 'category',
          embeddable: true,
          href: '/wp-json/wp/v2/categories?post=60',
        },
        {
          taxonomy: 'post_tag',
          embeddable: true,
          href: '/wp-json/wp/v2/tags?post=60',
        },
      ],
      curies: [
        {
          name: 'wp',
          href: 'https://api.w.org/{rel}',
          templated: true,
        },
      ],
    },
  },
  description: 'Triggers when a new post is published',
  aiMetadata: {
    description: 'Fires when a new post is published on the WordPress site, optionally filtered to specific authors. Each event represents one newly published post, including a post published with an earlier publish date, and emits that post record. Edits to existing posts do not fire, except an edit that moves the publish date of an older post to the current time, which fires like a newly published post. Polls periodically, so there may be a short delay after publishing.',
  },
  props: {
    authors: wordpressCommon.authors,
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    const { items } = await wordpressApi.list<WordpressPost>({
      auth: ctx.auth,
      path: '/posts',
      queryParams: withAuthor({
        authors: normalizeAuthors(ctx.propsValue.authors),
        queryParams: { orderby: 'date', order: 'desc', per_page: String(SAMPLE_SIZE), page: '1' },
      }),
      timeout: REQUEST_TIMEOUT_MS,
    });
    return [...items].sort((a, b) => compareOldestFirst({ a, b }));
  },
  async onEnable(ctx) {
    const authors = normalizeAuthors(ctx.propsValue.authors);
    const existing = await ctx.store.get<CursorState>(STATE_KEY);
    if (ctx.isRepublish && !isNil(existing) && existing.authors === authors) {
      return;
    }
    const legacyLastPoll = await ctx.store.get<number>(LEGACY_STATE_KEY);
    const budget = createBudget({ startedAt: Date.now() });
    if (ctx.isRepublish && isNil(existing) && !isNil(legacyLastPoll)) {
      const migrated = await migrateLegacyCursor({ auth: ctx.auth, authors, legacyLastPoll, budget });
      await ctx.store.put(STATE_KEY, migrated);
      await ctx.store.delete(LEGACY_STATE_KEY);
      return;
    }
    await ctx.store.put(STATE_KEY, await createBaseline({ auth: ctx.auth, authors, budget }));
    await ctx.store.delete(LEGACY_STATE_KEY);
  },
  async onDisable() {
    return;
  },
  async run(ctx) {
    const budget = createBudget({ startedAt: Date.now() });
    const authors = normalizeAuthors(ctx.propsValue.authors);
    const existing = await ctx.store.get<CursorState>(STATE_KEY);
    if (!isNil(existing)) {
      return pollAndStore({ auth: ctx.auth, authors, state: existing, store: ctx.store, budget });
    }
    const legacyLastPoll = await ctx.store.get<number>(LEGACY_STATE_KEY);
    if (isNil(legacyLastPoll)) {
      await ctx.store.put(STATE_KEY, await createBaseline({ auth: ctx.auth, authors, budget }));
      return [];
    }
    const migrated = await migrateLegacyCursor({ auth: ctx.auth, authors, legacyLastPoll, budget });
    await ctx.store.put(STATE_KEY, migrated);
    await ctx.store.delete(LEGACY_STATE_KEY);
    return pollAndStore({ auth: ctx.auth, authors, state: migrated, store: ctx.store, budget });
  },
});

async function pollAndStore({
  auth,
  authors,
  state,
  store,
  budget,
}: {
  auth: WordpressAuthValue;
  authors: string | null;
  state: CursorState;
  store: { put: <T>(key: string, value: T) => Promise<T> };
  budget: PollBudget;
}): Promise<WordpressPost[]> {
  const result = await pollNewPosts({ auth, authors, state, budget });
  await store.put(STATE_KEY, result.state);
  return result.posts;
}

async function pollNewPosts({
  auth,
  authors,
  state,
  budget,
}: {
  auth: WordpressAuthValue;
  authors: string | null;
  state: CursorState;
  budget: PollBudget;
}): Promise<{ posts: WordpressPost[]; state: CursorState }> {
  const byDate = await readWindow({
    auth,
    authors,
    field: 'date',
    cursor: state.byDate,
    lookbackMs: DATE_LOOKBACK_MS,
    budget,
    firstPageReserve: 0,
    reservedRequests: LISTING_COUNT - 1,
  });
  const byModified = await readWindow({
    auth,
    authors,
    field: 'modified',
    cursor: state.byModified,
    lookbackMs: MODIFIED_LOOKBACK_MS,
    budget,
    firstPageReserve: 1,
    reservedRequests: 1,
  });
  const byId = await readIdListing({
    auth,
    authors,
    cursor: state.byId ?? { floorId: state.baselineId, topId: state.baselineId, resumePage: null },
    budget,
  });
  const seenIds = new Set(state.seen.map(([id]) => id));
  const unpublishedAtStart = new Set(state.unpublishedIds ?? []);
  const candidates = uniqueById({ posts: [...byDate.posts, ...byModified.posts, ...byId.posts] });
  const dateHorizonMs = byDate.cursor.complete ? Number.POSITIVE_INFINITY : byDate.cursor.ms;
  const fresh = candidates
    .filter(
      (post) =>
        !seenIds.has(post.id) &&
        !(timeMs({ post, field: 'date' }) > dateHorizonMs) &&
        (unpublishedAtStart.has(post.id) ||
          post.id > state.baselineId ||
          timeMs({ post, field: 'date' }) > state.publishedFloorMs)
    )
    .sort((a, b) => compareOldestFirst({ a, b }));
  const firedIds = new Set(fresh.map((post) => post.id));
  const pruned = pruneSeen({
    seen: [...state.seen, ...fresh.map(toSeenEntry)],
    baselineId: state.baselineId,
    publishedFloorMs: state.publishedFloorMs,
    idFloor: (byId.cursor.pendingIds ?? []).reduce((acc, id) => Math.min(acc, id - 1), byId.cursor.floorId),
  });
  return {
    posts: fresh,
    state: {
      ...state,
      ...pruned,
      byDate: byDate.cursor,
      byModified: byModified.cursor,
      byId: byId.cursor,
      unpublishedIds: (state.unpublishedIds ?? []).filter((id) => !firedIds.has(id)),
    },
  };
}

async function readIdListing({
  auth,
  authors,
  cursor,
  budget,
}: {
  auth: WordpressAuthValue;
  authors: string | null;
  cursor: IdCursor;
  budget: PollBudget;
}): Promise<{ posts: WordpressPost[]; cursor: IdCursor }> {
  const posts: WordpressPost[] = [];
  let pendingIds = cursor.pendingIds ?? [];
  while (pendingIds.length > 0) {
    if (!budget.canStart({ reservedRequests: 0 })) {
      console.warn(`WordPress New Post: poll time budget reached while reading ${pendingIds.length} new posts; the rest is read on the next poll.`);
      return { posts, cursor: { ...cursor, pendingIds } };
    }
    const batch = pendingIds.slice(0, PAGE_SIZE);
    posts.push(...(await readPostsByIds({ auth, ids: batch, budget })));
    pendingIds = pendingIds.slice(batch.length);
  }
  const queryParams = withAuthor({
    authors,
    queryParams: { orderby: 'id', order: 'desc', per_page: String(PAGE_SIZE), _fields: 'id' },
  });
  const firstPage = cursor.resumePage ?? 1;
  let topId = cursor.resumePage === null ? cursor.floorId : cursor.topId;
  const done = (): IdCursor => ({ floorId: Math.max(cursor.floorId, topId), topId: 0, resumePage: null, pendingIds });
  for (let page = firstPage; page < firstPage + MAX_PAGES_PER_WINDOW; page++) {
    if (!budget.canStart({ reservedRequests: 0 })) {
      console.warn(`WordPress New Post: poll time budget reached in the id listing after ${posts.length} posts; the rest is read on the next poll.`);
      return { posts, cursor: page === firstPage ? { ...cursor, pendingIds } : { floorId: cursor.floorId, topId, resumePage: page, pendingIds } };
    }
    const result = await listPage({ auth, queryParams, page, budget });
    if (isNil(result)) {
      return { posts, cursor: done() };
    }
    const newerIds = result.items.map((post) => post.id).filter((id) => Number.isInteger(id) && id > cursor.floorId);
    topId = newerIds.reduce((acc, id) => Math.max(acc, id), topId);
    if (newerIds.length > 0) {
      if (budget.canStart({ reservedRequests: 0 })) {
        posts.push(...(await readPostsByIds({ auth, ids: newerIds, budget })));
      } else {
        pendingIds = [...pendingIds, ...newerIds];
      }
    }
    const totalPages = result.total_pages ?? (result.items.length < PAGE_SIZE ? page : page + 1);
    if (newerIds.length < result.items.length || result.items.length === 0 || page >= totalPages) {
      return { posts, cursor: done() };
    }
    if (pendingIds.length > 0) {
      return { posts, cursor: { floorId: cursor.floorId, topId, resumePage: page + 1, pendingIds } };
    }
  }
  console.warn(`WordPress New Post: read the maximum of ${MAX_PAGES_PER_WINDOW} pages in the id listing; the rest is read on the next poll.`);
  return { posts, cursor: { floorId: cursor.floorId, topId, resumePage: firstPage + MAX_PAGES_PER_WINDOW, pendingIds } };
}

async function readPostsByIds({
  auth,
  ids,
  budget,
}: {
  auth: WordpressAuthValue;
  ids: number[];
  budget: PollBudget;
}): Promise<WordpressPost[]> {
  const result = await listPage({
    auth,
    budget,
    page: 1,
    queryParams: { include: ids.join(','), orderby: 'id', order: 'desc', per_page: String(ids.length) },
  });
  const wanted = new Set(ids);
  return (result?.items ?? []).filter((post) => wanted.has(post.id));
}

async function readWindow({
  auth,
  authors,
  field,
  cursor,
  lookbackMs,
  budget,
  firstPageReserve,
  reservedRequests,
}: {
  auth: WordpressAuthValue;
  authors: string | null;
  field: TimeField;
  cursor: WindowCursor;
  lookbackMs: number;
  budget: PollBudget;
  firstPageReserve: number;
  reservedRequests: number;
}): Promise<{ posts: WordpressPost[]; cursor: WindowCursor }> {
  const startMs = cursor.resume
    ? cursor.resume.startMs
    : Math.max(0, cursor.ms - (cursor.complete ? lookbackMs : TIE_OVERLAP_MS));
  const startPage = cursor.resume?.page ?? 1;
  const windowParam = field === 'date' ? 'after' : 'modified_after';
  const result = await readPages({
    auth,
    budget,
    startPage,
    firstPageReserve,
    reservedRequests,
    ignoresWindow: (first) =>
      field === 'modified' && startPage === 1 && startMs > 0 && timeMs({ post: first, field }) <= startMs - IGNORED_WINDOW_MARGIN_MS,
    queryParams: withAuthor({
      authors,
      queryParams: {
        orderby: field,
        order: 'asc',
        per_page: String(PAGE_SIZE),
        ...(startMs > 0 ? { [windowParam]: new Date(startMs).toISOString() } : {}),
      },
    }),
  });
  if (!result.requested) {
    return { posts: [], cursor };
  }
  if (result.ignoredWindow) {
    return { posts: [], cursor: { ms: Math.max(cursor.ms, Date.now()), complete: true } };
  }
  const newestKey = result.posts
    .map((post) => timeMs({ post, field }))
    .filter((ms) => Number.isFinite(ms))
    .reduce((acc, ms) => Math.max(acc, ms), cursor.ms);
  const ms = Math.max(cursor.ms, Math.min(newestKey, Date.now()));
  if (!result.complete) {
    console.warn(`WordPress New Post: the ${field} listing continues on the next poll.`);
  }
  return {
    posts: result.posts,
    cursor: result.complete ? { ms, complete: true } : { ms, complete: false, resume: { startMs, page: result.nextPage } },
  };
}

async function readPages({
  auth,
  queryParams,
  budget,
  startPage = 1,
  firstPageReserve = 0,
  reservedRequests = 0,
  ignoresWindow,
}: {
  auth: WordpressAuthValue;
  queryParams: QueryParams;
  budget: PollBudget;
  startPage?: number;
  firstPageReserve?: number;
  reservedRequests?: number;
  ignoresWindow?: (first: WordpressPost) => boolean;
}): Promise<PageReadResult> {
  const posts: WordpressPost[] = [];
  for (let page = startPage; page < startPage + MAX_PAGES_PER_WINDOW; page++) {
    if (!budget.canStart({ reservedRequests: page === startPage ? firstPageReserve : reservedRequests })) {
      console.warn(`WordPress New Post: poll time budget reached after ${posts.length} posts.`);
      return { posts, complete: false, requested: page > startPage, nextPage: page };
    }
    const result = await listPage({ auth, queryParams, page, budget });
    if (isNil(result)) {
      return { posts, complete: true, requested: true, nextPage: page };
    }
    if (page === startPage && result.items.length > 0 && ignoresWindow?.(result.items[0])) {
      console.warn('WordPress New Post: this site ignores modified_after (WordPress before 5.7); the modified listing is skipped.');
      return { posts: [], complete: true, requested: true, ignoredWindow: true, nextPage: startPage };
    }
    posts.push(...result.items);
    const totalPages = result.total_pages ?? (result.items.length < PAGE_SIZE ? page : page + 1);
    if (result.items.length === 0 || page >= totalPages) {
      return { posts, complete: true, requested: true, nextPage: page + 1 };
    }
  }
  console.warn(`WordPress New Post: read the maximum of ${MAX_PAGES_PER_WINDOW} pages (${posts.length} posts).`);
  return { posts, complete: false, requested: true, nextPage: startPage + MAX_PAGES_PER_WINDOW };
}

async function listPage({
  auth,
  queryParams,
  page,
  budget,
}: {
  auth: WordpressAuthValue;
  queryParams: QueryParams;
  page: number;
  budget: PollBudget;
}): Promise<{ items: WordpressPost[]; total_pages: number | undefined } | null> {
  const startedAt = Date.now();
  try {
    return await wordpressApi.list<WordpressPost>({
      auth,
      path: '/posts',
      queryParams: { ...queryParams, page: String(page) },
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (error) {
    if (page > 1 && error instanceof WordpressApiError && error.code === 'rest_post_invalid_page_number') {
      return null;
    }
    throw error;
  } finally {
    budget.record({ durationMs: Date.now() - startedAt });
  }
}

function createBudget({ startedAt }: { startedAt: number }): PollBudget {
  const deadline = startedAt + POLL_BUDGET_MS;
  let slowestMs = 0;
  const estimate = () => Math.min(Math.max(slowestMs, MIN_REQUEST_ESTIMATE_MS), REQUEST_TIMEOUT_MS);
  return {
    canStart: ({ reservedRequests }) => Date.now() + estimate() * (1 + reservedRequests) <= deadline,
    record: ({ durationMs }) => {
      slowestMs = Math.max(slowestMs, durationMs);
    },
  };
}

async function createBaseline({
  auth,
  authors,
  budget,
}: {
  auth: WordpressAuthValue;
  authors: string | null;
  budget: PollBudget;
}): Promise<CursorState> {
  const startedAt = Date.now();
  const [newestById, newestByDate, newestByModified] = await Promise.all(
    (['id', 'date', 'modified'] as const).map((orderby) => newestPost({ auth, authors, orderby }))
  );
  budget.record({ durationMs: Date.now() - startedAt });
  const now = Date.now();
  const newestDateMs = finiteOrZero(newestByDate ? timeMs({ post: newestByDate, field: 'date' }) : 0);
  const publishedFloorMs = Math.min(newestDateMs, now);
  const modifiedMs = Math.min(finiteOrZero(newestByModified ? timeMs({ post: newestByModified, field: 'modified' }) : 0), now);
  const futureDated =
    newestDateMs > now
      ? await readPages({
          auth,
          budget,
          queryParams: withAuthor({
            authors,
            queryParams: { orderby: 'date', order: 'asc', per_page: String(PAGE_SIZE), after: new Date(now).toISOString() },
          }),
        })
      : { posts: [] };
  const unpublishedIds = await readUnpublishedIds({ auth, authors, budget });
  return {
    authors,
    baselineId: newestById?.id ?? 0,
    publishedFloorMs,
    byDate: { ms: publishedFloorMs, complete: true },
    byModified: { ms: modifiedMs, complete: true },
    byId: { floorId: newestById?.id ?? 0, topId: 0, resumePage: null },
    seen: futureDated.posts.slice(-SEEN_LIMIT).map(toSeenEntry),
    unpublishedIds,
  };
}

async function readUnpublishedIds({
  auth,
  authors,
  budget,
}: {
  auth: WordpressAuthValue;
  authors: string | null;
  budget: PollBudget;
}): Promise<number[]> {
  try {
    const result = await readPages({
      auth,
      budget,
      firstPageReserve: 1,
      reservedRequests: 1,
      queryParams: withAuthor({
        authors,
        queryParams: {
          status: UNPUBLISHED_STATUSES,
          orderby: 'modified',
          order: 'desc',
          per_page: String(PAGE_SIZE),
          _fields: 'id',
        },
      }),
    });
    if (!result.complete) {
      console.warn(`WordPress New Post: remembered the ${result.posts.length} most recently edited drafts only. An older draft that is later published with an earlier date does not fire.`);
    }
    return result.posts.map((post) => post.id).filter((id) => Number.isInteger(id));
  } catch (error) {
    if (error instanceof WordpressApiError && FORBIDDEN_LIST_STATUSES.includes(error.status)) {
      console.warn('WordPress New Post: the connected user cannot list drafts. A draft that exists now and is later published with an earlier date does not fire.');
      return [];
    }
    if (isTransientError(error)) {
      console.warn('WordPress New Post: could not list drafts (server error or timeout). A draft that exists now and is later published with an earlier date does not fire.');
      return [];
    }
    throw error;
  }
}

function isTransientError(error: unknown): boolean {
  if (error instanceof WordpressApiError) {
    return error.status >= 500 || error.status === 408 || error.status === 429;
  }
  return error instanceof Error && /timeout|timed out|abort|ECONNRESET|ETIMEDOUT/i.test(`${error.name} ${error.message}`);
}

async function migrateLegacyCursor({
  auth,
  authors,
  legacyLastPoll,
  budget,
}: {
  auth: WordpressAuthValue;
  authors: string | null;
  legacyLastPoll: number;
  budget: PollBudget;
}): Promise<CursorState> {
  const baseline = await createBaseline({ auth, authors, budget });
  const windowStartMs = Math.max(0, Math.min(legacyLastPoll, Date.now()) - LEGACY_SKEW_MS);
  const pending = await readPages({
    auth,
    budget,
    queryParams: withAuthor({
      authors,
      queryParams: {
        orderby: 'date',
        order: 'asc',
        per_page: String(PAGE_SIZE),
        after: new Date(windowStartMs).toISOString(),
      },
    }),
  });
  if (!pending.complete) {
    console.warn('WordPress New Post: could not read all posts since the last check while upgrading; continuing from now.');
    return baseline;
  }
  const alreadyHandled = pending.posts.filter((post) => dayjs(post.date).valueOf() <= legacyLastPoll);
  return {
    ...baseline,
    publishedFloorMs: windowStartMs,
    byDate: { ms: windowStartMs, complete: false },
    seen: uniqueSeen({ entries: [...baseline.seen, ...alreadyHandled.map(toSeenEntry)] }),
  };
}

async function newestPost({
  auth,
  authors,
  orderby,
}: {
  auth: WordpressAuthValue;
  authors: string | null;
  orderby: 'id' | 'date' | 'modified';
}): Promise<WordpressPost | undefined> {
  const { items } = await wordpressApi.list<WordpressPost>({
    auth,
    path: '/posts',
    queryParams: withAuthor({ authors, queryParams: { orderby, order: 'desc', per_page: '1', page: '1' } }),
    timeout: REQUEST_TIMEOUT_MS,
  });
  return items[0];
}

function withAuthor({ authors, queryParams }: { authors: string | null; queryParams: QueryParams }): QueryParams {
  return authors ? { ...queryParams, author: authors } : queryParams;
}

function normalizeAuthors(authors: unknown): string | null {
  if (isNil(authors)) {
    return null;
  }
  const value = String(authors).trim();
  return value === '' ? null : value;
}

function timeMs({ post, field }: { post: WordpressPost; field: TimeField }): number {
  const gmt = field === 'date' ? post.date_gmt : post.modified_gmt;
  const local = field === 'date' ? post.date : post.modified;
  const raw = typeof gmt === 'string' && gmt !== '' && !gmt.startsWith('0000') ? gmt : local;
  if (typeof raw !== 'string' || raw === '') {
    return Number.NaN;
  }
  return Date.parse(HAS_ZONE.test(raw) ? raw : `${raw}Z`);
}

function finiteOrZero(ms: number): number {
  return Number.isFinite(ms) ? ms : 0;
}

function compareOldestFirst({ a, b }: { a: WordpressPost; b: WordpressPost }): number {
  const byTime = finiteOrZero(timeMs({ post: a, field: 'date' })) - finiteOrZero(timeMs({ post: b, field: 'date' }));
  return byTime !== 0 ? byTime : a.id - b.id;
}

function uniqueById({ posts }: { posts: WordpressPost[] }): WordpressPost[] {
  return [...new Map(posts.map((post) => [post.id, post])).values()];
}

function uniqueSeen({ entries }: { entries: SeenEntry[] }): SeenEntry[] {
  return [...new Map(entries.map((entry) => [entry[0], entry])).values()].slice(-SEEN_LIMIT);
}

function toSeenEntry(post: WordpressPost): SeenEntry {
  return [post.id, finiteOrZero(timeMs({ post, field: 'date' }))];
}

function pruneSeen({
  seen,
  baselineId,
  publishedFloorMs,
  idFloor,
}: {
  seen: SeenEntry[];
  baselineId: number;
  publishedFloorMs: number;
  idFloor: number;
}): Pick<CursorState, 'seen' | 'baselineId' | 'publishedFloorMs'> {
  if (seen.length <= SEEN_LIMIT) {
    return { seen, baselineId, publishedFloorMs };
  }
  const droppableIndexes = seen
    .map(([id], index) => ({ id, index }))
    .filter(({ id }) => id <= idFloor)
    .slice(0, seen.length - SEEN_LIMIT)
    .map(({ index }) => index);
  const droppable = new Set(droppableIndexes);
  const kept = seen.filter((_, index) => !droppable.has(index));
  const overflow = Math.max(0, kept.length - SEEN_HARD_LIMIT);
  if (overflow > 0) {
    console.warn(`WordPress New Post: more than ${SEEN_HARD_LIMIT} posts are waiting for the id listing; the oldest ${overflow} fired posts are forgotten.`);
  }
  const dropped = [...seen.filter((_, index) => droppable.has(index)), ...kept.slice(0, overflow)];
  return {
    seen: kept.slice(overflow),
    baselineId: dropped.reduce((acc, [id]) => Math.max(acc, id), baselineId),
    publishedFloorMs: dropped.reduce((acc, [, ms]) => Math.max(acc, ms), publishedFloorMs),
  };
}

const STATE_KEY = 'wordpress_new_post_cursor';
const LEGACY_STATE_KEY = 'lastPoll';
const PAGE_SIZE = 100;
const MAX_PAGES_PER_WINDOW = 10;
const SAMPLE_SIZE = 5;
const SEEN_LIMIT = 2000;
const SEEN_HARD_LIMIT = 10_000;
const REQUEST_TIMEOUT_MS = 15_000;
const POLL_BUDGET_MS = 45_000;
const MIN_REQUEST_ESTIMATE_MS = 2_000;
const LISTING_COUNT = 3;
const DATE_LOOKBACK_MS = 60 * 60 * 1000;
const MODIFIED_LOOKBACK_MS = 2 * 60 * 1000;
const TIE_OVERLAP_MS = 1000;
// WordPress compares modified_after with the local post_modified, so after a DST fall-back a post edited in the
// repeated hour can come back up to 1 h before the window. Only a gap larger than that means modified_after is ignored.
const IGNORED_WINDOW_MARGIN_MS = 2 * 60 * 60 * 1000;
const LEGACY_SKEW_MS = 14 * 60 * 60 * 1000;
const HAS_ZONE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;
const UNPUBLISHED_STATUSES = 'draft,pending,future';
const FORBIDDEN_LIST_STATUSES = [400, 401, 403];

type TimeField = 'date' | 'modified';

type SeenEntry = [number, number];

type PageReadResult = { posts: WordpressPost[]; complete: boolean; requested: boolean; nextPage: number; ignoredWindow?: boolean };

type PollBudget = {
  canStart: (params: { reservedRequests: number }) => boolean;
  record: (params: { durationMs: number }) => void;
};

type IdCursor = { floorId: number; topId: number; resumePage: number | null; pendingIds?: number[] };

type WindowCursor = { ms: number; complete: boolean; resume?: { startMs: number; page: number } };

type CursorState = {
  authors: string | null;
  baselineId: number;
  publishedFloorMs: number;
  byDate: WindowCursor;
  byModified: WindowCursor;
  byId?: IdCursor;
  seen: SeenEntry[];
  unpublishedIds?: number[];
};

type WordpressPost = {
  id: number;
  date: string;
  date_gmt?: string | null;
  modified?: string;
  modified_gmt?: string | null;
  [key: string]: unknown;
};
