import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const fake = vi.hoisted(() => ({
  pages: [] as FakePage[],
  comments: [] as FakeComment[],
  seq: 0,
  requests: 0,
  searchBodies: [] as unknown[],
}));

vi.mock('@notionhq/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@notionhq/client')>();
  class Client {
    databases = { query: async (args: QueryArgs) => queryDatabase(args) };
    comments = { list: async (args: ListArgs) => listComments(args) };
    search = async (args: SearchArgs) => search({ args, actual });
  }
  return { ...actual, Client };
});

import { newDatabaseItem } from '../src/lib/triggers/new-database-item';
import { updatedDatabaseItem } from '../src/lib/triggers/updated-database-item';
import { newComment } from '../src/lib/triggers/new-comment';
import { updatedPage } from '../src/lib/triggers/updated-page';

describe('Updated Database Item', () => {
  it('delivers a second edit of the same row made in the same minute (PIE-1170)', async () => {
    addPage({ id: 'inv', at: '09:00:05', status: 'Draft' });
    const ctx = makeCtx({ database_id: 'db' });
    await hook(updatedDatabaseItem.onEnable, ctx);

    editPage({ id: 'inv', at: '10:03:10', status: 'Approved' });
    const first = await poll(updatedDatabaseItem, ctx);
    editPage({ id: 'inv', at: '10:03:45', status: 'Paid' });
    const second = await poll(updatedDatabaseItem, ctx);
    const third = await poll(updatedDatabaseItem, ctx);

    expect([...first, ...second, ...third].map(status)).toEqual([
      'Approved',
      'Paid',
    ]);
  });

  it('re-editing the last row of a bulk edit delivers only that row (PIE-1008)', async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `task-${i}`);
    ids.forEach((id) => addPage({ id, at: '08:00:00', status: 'Todo' }));
    const ctx = makeCtx({ database_id: 'db' });
    await hook(updatedDatabaseItem.onEnable, ctx);

    ids.forEach((id, i) =>
      editPage({ id, at: `10:00:${10 + i * 3}`, status: 'In progress' })
    );
    const bulk = await poll(updatedDatabaseItem, ctx);
    editPage({ id: 'task-9', at: '10:03:05', status: 'Done' });
    const reedit = await poll(updatedDatabaseItem, ctx);
    const idle = await poll(updatedDatabaseItem, ctx);

    expect(bulk).toHaveLength(10);
    expect(reedit.map(idAndStatus)).toEqual(['task-9:Done']);
    expect(idle).toEqual([]);
  });

  it('a bulk edit bigger than one check is delivered over several checks (PIE-907)', async () => {
    const ids = Array.from({ length: 2500 }, (_, i) => `row-${i}`);
    ids.forEach((id) => addPage({ id, at: '08:00:00', status: 'Todo' }));
    const ctx = makeCtx({ database_id: 'db' });
    await hook(updatedDatabaseItem.onEnable, ctx);

    ids.forEach((id) => editPage({ id, at: '10:00:30', status: 'Done' }));
    const { delivered, maxRequests } = await drain({
      trigger: updatedDatabaseItem,
      ctx,
      polls: 5,
    });

    expect(delivered).toHaveLength(2500);
    expect(new Set(delivered).size).toBe(2500);
    expect(maxRequests).toBeLessThanOrEqual(10);
  });
});

describe('Updated Database Item, edge cases from review', () => {
  it('delivers an edit that returns a row to an earlier value in the same minute', async () => {
    addPage({ id: 'inv', at: '09:00:00', status: 'Draft' });
    const ctx = makeCtx({ database_id: 'db' });
    await hook(updatedDatabaseItem.onEnable, ctx);

    editPage({ id: 'inv', at: '10:00:05', status: 'Approved' });
    const first = await poll(updatedDatabaseItem, ctx);
    editPage({ id: 'inv', at: '10:00:20', status: 'Draft' });
    const second = await poll(updatedDatabaseItem, ctx);
    editPage({ id: 'inv', at: '10:00:40', status: 'Approved' });
    const third = await poll(updatedDatabaseItem, ctx);

    expect([...first, ...second, ...third].map(status)).toEqual([
      'Approved',
      'Draft',
      'Approved',
    ]);
  });

  it('turning on with more than 100 rows in the newest minute sends none of them', async () => {
    Array.from({ length: 250 }, (_, i) =>
      addPage({ id: `row-${i}`, at: '09:00:00', status: 'Todo' })
    );
    const ctx = makeCtx({ database_id: 'db' });
    await hook(updatedDatabaseItem.onEnable, ctx);

    const first = await poll(updatedDatabaseItem, ctx);
    const second = await poll(updatedDatabaseItem, ctx);

    expect([...first, ...second]).toEqual([]);
  });
});

describe('New Database Item', () => {
  it('delivers every row added after turning on with an empty database (PIE-1103)', async () => {
    vi.setSystemTime(at('09:00:30'));
    const ctx = makeCtx({ database_id: 'db' });
    await hook(newDatabaseItem.onEnable, ctx);

    Array.from({ length: 150 }, (_, i) =>
      addPage({ id: `page-${i}`, at: '09:01:00', status: 'New' })
    );
    const delivered = await poll(newDatabaseItem, ctx);

    expect(new Set(delivered.map(id)).size).toBe(150);
  });

  it('a large import is delivered over several checks (PIE-907)', async () => {
    addPage({ id: 'old', at: '09:00:00', status: 'New' });
    const ctx = makeCtx({ database_id: 'db' });
    await hook(newDatabaseItem.onEnable, ctx);

    Array.from({ length: 2500 }, (_, i) =>
      addPage({ id: `row-${i}`, at: '10:00:00', status: 'New' })
    );
    const { delivered, maxRequests } = await drain({
      trigger: newDatabaseItem,
      ctx,
      polls: 5,
    });

    expect(delivered).toHaveLength(2500);
    expect(new Set(delivered).size).toBe(2500);
    expect(maxRequests).toBeLessThanOrEqual(10);
  });

  it('test() returns the five newest rows, newest first', async () => {
    Array.from({ length: 7 }, (_, i) =>
      addPage({ id: `page-${i}`, at: `09:0${i}:00`, status: 'New' })
    );
    const sample = await hook(
      newDatabaseItem.test,
      makeCtx({ database_id: 'db' })
    );

    expect(sample.map(id)).toEqual([
      'page-6',
      'page-5',
      'page-4',
      'page-3',
      'page-2',
    ]);
  });
});

describe('republishing a database trigger', () => {
  it('keeps the existing checkpoint, so nothing is lost or re-sent', async () => {
    addPage({ id: 'a', at: '09:00:00', status: 'New' });
    const ctx = makeCtx({ database_id: 'db' });
    await hook(newDatabaseItem.onEnable, ctx);
    addPage({ id: 'b', at: '09:05:00', status: 'New' });

    await hook(newDatabaseItem.onEnable, { ...ctx, isRepublish: true });
    const delivered = await poll(newDatabaseItem, ctx);

    expect(delivered.map(id)).toEqual(['b']);
  });

  it('converts the checkpoint saved by older piece versions', async () => {
    addPage({ id: 'sent', at: '09:00:00', status: 'New' });
    addPage({ id: 'missed', at: '09:03:00', status: 'New' });
    const ctx = makeCtx({ database_id: 'db' });
    await ctx.store.put('lastItem', `sent|${at('09:00:00')}`);

    await hook(newDatabaseItem.onEnable, { ...ctx, isRepublish: true });
    const delivered = await poll(newDatabaseItem, ctx);

    expect(delivered.map(id)).toEqual(['missed']);
    expect(await ctx.store.get('lastItem')).toBeNull();
  });

  it('turning on again without a republish starts from now', async () => {
    addPage({ id: 'a', at: '09:00:00', status: 'New' });
    const ctx = makeCtx({ database_id: 'db' });
    await hook(newDatabaseItem.onEnable, ctx);
    addPage({ id: 'b', at: '09:05:00', status: 'New' });

    await hook(newDatabaseItem.onEnable, ctx);
    const delivered = await poll(newDatabaseItem, ctx);

    expect(delivered).toEqual([]);
  });
});

describe('New Comment', () => {
  it('delivers a comment posted in the same minute as the last delivered one (PIE-928)', async () => {
    addComment({ id: 'A', at: '07:19:05' });
    const ctx = makeCtx({ page_id: 'page-1' });
    await hook(newComment.onEnable, ctx);

    addComment({ id: 'B', at: '07:19:40' });
    const first = await poll(newComment, ctx);
    addComment({ id: 'C', at: '07:21:00' });
    const second = await poll(newComment, ctx);

    expect([...first, ...second].map(id)).toEqual(['B', 'C']);
  });

  it('keeps its checkpoint on republish', async () => {
    addComment({ id: 'A', at: '07:19:05' });
    const ctx = makeCtx({ page_id: 'page-1' });
    await hook(newComment.onEnable, ctx);
    addComment({ id: 'B', at: '07:25:00' });

    await hook(newComment.onEnable, { ...ctx, isRepublish: true });
    const delivered = await poll(newComment, ctx);

    expect(delivered.map(id)).toEqual(['B']);
  });
});

describe('Updated Page', () => {
  it('delivers every page edited between checks, not only the newest 100', async () => {
    Array.from({ length: 300 }, (_, i) =>
      addPage({ id: `p-${i}`, at: '09:00:00', status: '' })
    );
    const ctx = makeCtx({});
    await hook(updatedPage.onEnable, ctx);

    Array.from({ length: 250 }, (_, i) =>
      editPage({ id: `p-${i}`, at: '10:00:00', status: '' })
    );
    const delivered = await poll(updatedPage, ctx);

    expect(new Set(delivered.map(id)).size).toBe(250);
  });

  it('keeps checking after it is turned on and sends only a valid search filter (PIE-1005)', async () => {
    addPage({ id: 'p1', at: '10:00:00', status: '' });
    addPage({ id: 'p2', at: '09:00:00', status: '' });
    const ctx = makeCtx({});
    await hook(updatedPage.onEnable, ctx);

    editPage({ id: 'p2', at: '10:02:00', status: '' });
    const delivered = await poll(updatedPage, ctx);

    expect(delivered.map(id)).toEqual(['p2']);
    expect(fake.searchBodies.at(-1)).toMatchObject({
      filter: { property: 'object', value: 'page' },
    });
  });
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(at('12:00:00'));
  fake.pages = [];
  fake.comments = [];
  fake.seq = 0;
  fake.requests = 0;
  fake.searchBodies = [];
});

afterEach(() => {
  vi.useRealTimers();
});

function makeCtx(propsValue: Record<string, string>) {
  const data = new Map<string, unknown>();
  return {
    auth: { type: 'CUSTOM_AUTH', props: { accessToken: 'secret_x' } },
    propsValue,
    files: {},
    store: {
      get: async (key: string) => (data.has(key) ? data.get(key) : null),
      put: async (key: string, value: unknown) => {
        data.set(key, value);
        return value;
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

async function hook(
  fn: (ctx: never) => unknown,
  ctx: unknown
): Promise<Emitted[]> {
  return Reflect.apply(fn, undefined, [ctx]);
}

async function poll(
  trigger: { run: (ctx: never) => unknown },
  ctx: unknown
): Promise<Emitted[]> {
  fake.requests = 0;
  return hook(trigger.run, ctx);
}

async function drain({
  trigger,
  ctx,
  polls,
}: {
  trigger: { run: (ctx: never) => unknown };
  ctx: unknown;
  polls: number;
}): Promise<{ delivered: string[]; maxRequests: number }> {
  const results: { ids: string[]; requests: number }[] = [];
  for (let i = 0; i < polls; i++) {
    const emitted = await poll(trigger, ctx);
    results.push({ ids: emitted.map(id), requests: fake.requests });
  }
  return {
    delivered: results.flatMap((r) => r.ids),
    maxRequests: Math.max(...results.map((r) => r.requests)),
  };
}

function id(item: Emitted): string {
  return item.id;
}

function status(item: Emitted): string | undefined {
  return item.property_values?.Status;
}

function idAndStatus(item: Emitted): string {
  return `${item.id}:${status(item)}`;
}

function at(hhmmss: string): number {
  return Date.parse(`2026-10-21T${hhmmss}Z`);
}

function minute(ms: number): number {
  return Math.floor(ms / 60000) * 60000;
}

function addPage({
  id,
  at: time,
  status,
}: {
  id: string;
  at: string;
  status: string;
}): void {
  fake.seq++;
  fake.pages.push({
    id,
    status,
    created: at(time),
    edited: at(time),
    seq: fake.seq,
    editSeq: fake.seq,
  });
}

function editPage({
  id,
  at: time,
  status,
}: {
  id: string;
  at: string;
  status: string;
}): void {
  fake.seq++;
  const page = fake.pages.find((p) => p.id === id);
  if (page) {
    page.status = status;
    page.edited = at(time);
    page.editSeq = fake.seq;
  }
}

function addComment({ id, at: time }: { id: string; at: string }): void {
  fake.seq++;
  fake.comments.push({ id, created: at(time), seq: fake.seq });
}

function pageToApi(page: FakePage) {
  return {
    object: 'page',
    id: page.id,
    url: `https://www.notion.so/${page.id}`,
    created_time: new Date(minute(page.created)).toISOString(),
    last_edited_time: new Date(minute(page.edited)).toISOString(),
    archived: false,
    parent: { type: 'database_id', database_id: 'db' },
    properties: {
      Name: { id: 'title', type: 'title', title: [{ plain_text: page.id }] },
      Status: { id: 's', type: 'select', select: { name: page.status } },
    },
  };
}

function paginate<T>({
  rows,
  cursor,
  size,
}: {
  rows: T[];
  cursor: string | undefined;
  size: number | undefined;
}) {
  const start = cursor ? Number(cursor) : 0;
  const pageSize = Math.min(size ?? 100, 100);
  const more = start + pageSize < rows.length;
  return {
    object: 'list',
    results: rows.slice(start, start + pageSize),
    has_more: more,
    next_cursor: more ? String(start + pageSize) : null,
  };
}

function queryDatabase(args: QueryArgs) {
  fake.requests++;
  const sort = args.sorts?.[0];
  const field = sort?.timestamp === 'created_time' ? 'created' : 'edited';
  const tie = field === 'created' ? 'seq' : 'editSeq';
  const direction = sort?.direction === 'ascending' ? 1 : -1;
  const bound = args.filter
    ? Date.parse(
        args.filter.created_time?.on_or_after ??
          args.filter.last_edited_time?.on_or_after ??
          ''
      )
    : Number.NEGATIVE_INFINITY;
  const filterField =
    args.filter?.timestamp === 'created_time' ? 'created' : 'edited';
  const rows = fake.pages
    .filter((p) => minute(p[filterField]) >= bound)
    .sort(
      (a, b) =>
        direction * (minute(a[field]) - minute(b[field]) || a[tie] - b[tie])
    );
  const page = paginate({
    rows,
    cursor: args.start_cursor,
    size: args.page_size,
  });
  return { ...page, results: page.results.map(pageToApi) };
}

function listComments(args: ListArgs) {
  fake.requests++;
  const rows = [...fake.comments].sort(
    (a, b) => minute(a.created) - minute(b.created) || a.seq - b.seq
  );
  const page = paginate({ rows, cursor: args.start_cursor, size: 100 });
  return {
    ...page,
    results: page.results.map((c) => ({
      object: 'comment',
      id: c.id,
      parent: { type: 'page_id', page_id: args.block_id },
      discussion_id: `d-${c.id}`,
      created_time: new Date(minute(c.created)).toISOString(),
      last_edited_time: new Date(minute(c.created)).toISOString(),
      created_by: { object: 'user', id: 'u' },
      rich_text: [],
    })),
  };
}

function search({
  args,
  actual,
}: {
  args: SearchArgs;
  actual: typeof import('@notionhq/client');
}) {
  fake.searchBodies.push(args);
  const keys = Object.keys(args.filter ?? {})
    .sort()
    .join(',');
  if (keys !== 'property,value') {
    throw new actual.APIResponseError({
      code: actual.APIErrorCode.ValidationError,
      status: 400,
      message: 'body failed validation',
      headers: {},
      rawBodyText: '',
    });
  }
  const rows = [...fake.pages].sort(
    (a, b) => minute(b.edited) - minute(a.edited) || b.editSeq - a.editSeq
  );
  const page = paginate({ rows, cursor: args.start_cursor, size: 100 });
  return { ...page, results: page.results.map(pageToApi) };
}

type FakePage = {
  id: string;
  status: string;
  created: number;
  edited: number;
  seq: number;
  editSeq: number;
};

type FakeComment = { id: string; created: number; seq: number };

type Emitted = { id: string; property_values?: Record<string, string> };

type QueryArgs = {
  filter?: {
    timestamp: string;
    created_time?: { on_or_after: string };
    last_edited_time?: { on_or_after: string };
  };
  sorts?: { timestamp: string; direction: string }[];
  start_cursor?: string;
  page_size?: number;
};

type ListArgs = { block_id: string; start_cursor?: string };

type SearchArgs = {
  filter?: Record<string, string>;
  start_cursor?: string;
};
