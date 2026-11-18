import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newOrUpdatedFile } from '../src/lib/triggers/new-or-updated-file';
import { DriveEvent, driveTestContext, TriggerStore } from './drive-test-context';

type VendorItem = { id: string; name: string; createdTime: string; modifiedTime: string; trashed?: boolean };

const trigger = driveTestContext.asPolling(newOrUpdatedFile);

const vendor = {
  items: new Array<VendorItem>(),
  failIds: new Set<string>(),
  stallIds: new Set<string>(),
  pageSize: 100,
  listCalls: 0,
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');
const tick = (minutes = 5) => {
  clock += minutes * 60_000;
  return new Date(clock).toISOString();
};

function addItem({ id, at }: { id: string; at?: string }) {
  const time = at ?? tick(1);
  vendor.items.push({ id, name: `${id}.pdf`, createdTime: time, modifiedTime: time });
}

function editItem({ id }: { id: string }) {
  const item = vendor.items.find((candidate) => candidate.id === id);
  if (item) item.modifiedTime = tick(1);
}

function deleteItem({ id }: { id: string }) {
  const item = vendor.items.find((candidate) => candidate.id === id);
  if (item) item.trashed = true;
}

function matchesQuery({ q, item }: { q: string; item: VendorItem }): boolean {
  return driveTestContext.matchesTimeQuery({ q, item }) && !item.trashed;
}

async function fakeFilesList(...args: unknown[]) {
  const params = driveTestContext.listParams(args);
  vendor.listCalls += 1;
  const offset = Number(params.pageToken ?? 0);
  const visible = driveTestContext.sortForOrderBy({
    items: vendor.items.filter((item) => matchesQuery({ q: params.q ?? '', item })),
    orderBy: params.orderBy,
  });
  const page = visible.slice(offset, offset + vendor.pageSize);
  const next = offset + vendor.pageSize < visible.length ? String(offset + vendor.pageSize) : undefined;
  return {
    status: 200,
    data: {
      incompleteSearch: false,
      nextPageToken: next,
      files: page.map(({ trashed: _trashed, ...file }) => ({ kind: 'drive#file', mimeType: 'application/pdf', webViewLink: `https://drive.google.com/file/d/${file.id}/view`, ...file })),
    },
  };
}

async function fakeFetch({ input, init }: { input: string | URL; init?: { signal?: AbortSignal } }) {
  const url = String(input);
  const id = /\/files\/([^/?]+)/.exec(url)?.[1] ?? '';
  if (url.includes('fields=mimeType')) {
    return new Response(JSON.stringify({ mimeType: 'application/pdf' }), { headers: { 'content-type': 'application/json' } });
  }
  if (vendor.failIds.has(id)) {
    return new Response(JSON.stringify({ error: { code: 403, message: 'fileNotDownloadable' } }), { status: 403, statusText: 'Forbidden' });
  }
  if (vendor.stallIds.has(id)) {
    return await new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('This operation was aborted', 'AbortError')));
    });
  }
  return new Response(`bytes of ${id}`);
}

function installFakeVendor() {
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList);
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL, init?: { signal?: AbortSignal }) => fakeFetch({ input, init })));
  driveTestContext.routeFileLookupsToFetch();
}

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    store: {
      put: async <T>(key: string, value: T) => {
        data.set(key, JSON.stringify(value));
        return value;
      },
      get: async <T>(key: string): Promise<T | null> => {
        const raw = data.get(key);
        return raw === undefined ? null : JSON.parse(raw);
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

function hookContext({ store, isRepublish, propsValue }: { store: TriggerStore; isRepublish?: boolean; propsValue?: typeof baseProps }) {
  return driveTestContext.triggerContext({ trigger, propsValue: propsValue ?? baseProps, store, isRepublish });
}

const ids = (events: unknown[]) => driveTestContext.driveEvents(events).map((event) => event.id);
const baseProps = { behaviourNote: undefined, file_types: undefined, parentFolder: undefined, include_team_drives: false, include_file_content: false };
const withContent = { ...baseProps, include_file_content: true };

beforeEach(() => {
  vendor.items = [];
  vendor.failIds.clear();
  vendor.stallIds.clear();
  vendor.listCalls = 0;
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  installFakeVendor();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('New or Updated File behaviour', () => {
  it('fires once per new file across polls, a republish and later files', async () => {
    addItem({ id: 'old-1' });
    addItem({ id: 'old-2' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    tick(1);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    addItem({ id: 'new-1' });
    addItem({ id: 'new-2' });
    addItem({ id: 'new-3' });
    const created = driveTestContext.driveEvents(await trigger.run(hookContext({ store })));
    expect(ids(created).sort()).toEqual(['new-1', 'new-2', 'new-3']);
    expect(created.every((event) => event.changeType === 'created')).toBe(true);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    addItem({ id: 'new-4' });
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['new-4']);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('an edit to an existing file fires once as updated', async () => {
    addItem({ id: 'old-1' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    editItem({ id: 'old-1' });
    const events = driveTestContext.driveEvents(await trigger.run(hookContext({ store })));
    expect(events.map((event) => [event.id, event.changeType])).toEqual([['old-1', 'updated']]);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('fires for both files that share the same createdTime millisecond', async () => {
    addItem({ id: 'seed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const sameTime = tick(1);
    addItem({ id: 'tie-a', at: sameTime });
    addItem({ id: 'tie-b', at: sameTime });
    expect(ids(await trigger.run(hookContext({ store }))).sort()).toEqual(['tie-a', 'tie-b']);
  });

  it('keeps working when the last-seen file is trashed', async () => {
    addItem({ id: 'a' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    addItem({ id: 'b' });
    await trigger.run(hookContext({ store }));
    deleteItem({ id: 'b' });
    addItem({ id: 'c' });
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['c']);
  });

  it('pages back to the checkpoint when more than one page arrives between polls', async () => {
    addItem({ id: 'seed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const burst = Array.from({ length: vendor.pageSize + 5 }, (_, index) => `burst-${index}`);
    burst.forEach((id) => addItem({ id }));
    const fired = ids(await trigger.run(hookContext({ store })));
    expect(new Set(fired)).toEqual(new Set(burst));
    expect(fired).toHaveLength(burst.length);
  });

  it('a failed download adds contentError and the other files keep their content', async () => {
    addItem({ id: 'seed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, propsValue: withContent }));
    addItem({ id: 'good-1' });
    addItem({ id: 'bad' });
    addItem({ id: 'good-2' });
    vendor.failIds.add('bad');
    const events = driveTestContext.driveEvents(await trigger.run(hookContext({ store, propsValue: withContent })));
    expect(ids(events).sort()).toEqual(['bad', 'good-1', 'good-2']);
    expect(events.find((event) => event.id === 'bad')?.contentError).toContain('403');
    expect(events.filter((event) => event.id !== 'bad').every((event) => typeof event.content === 'string')).toBe(true);
  });

  it('a stalled download returns contentError before the content deadline', async () => {
    vi.mocked(Date.now).mockRestore();
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    addItem({ id: 'seed' });
    vi.setSystemTime(clock);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, propsValue: withContent }));
    addItem({ id: 'quick' });
    addItem({ id: 'stalled' });
    vi.setSystemTime(clock);
    vendor.stallIds.add('stalled');
    let output: DriveEvent[] | undefined;
    const run = trigger.run(hookContext({ store, propsValue: withContent })).then((events) => {
      output = driveTestContext.driveEvents(events);
    });
    await vi.advanceTimersByTimeAsync(39_000);
    expect(output).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1_500);
    await run;
    expect(ids(output ?? []).sort()).toEqual(['quick', 'stalled']);
    const stalled = output?.find((event) => event.id === 'stalled');
    expect(stalled?.content).toBeUndefined();
    expect(stalled?.contentError).toBe('Timed out before the file content could be downloaded');
    expect(typeof output?.find((event) => event.id === 'quick')?.content).toBe('string');
  });

  it('test() reads one files.list page', async () => {
    Array.from({ length: vendor.pageSize * 3 }, (_, index) => `file-${index}`).forEach((id) => addItem({ id }));
    const { store } = memoryStore();
    const sample = await trigger.test(hookContext({ store }));
    expect(vendor.listCalls).toBe(1);
    expect(ids(sample)[0]).toBe(`file-${vendor.pageSize * 3 - 1}`);
  });

  it('test() returns the newest real file first, with no trashed files', async () => {
    addItem({ id: 'older' });
    addItem({ id: 'newest' });
    addItem({ id: 'gone' });
    deleteItem({ id: 'gone' });
    const { store } = memoryStore();
    const sample = await trigger.test(hookContext({ store }));
    expect(ids(sample)[0]).toBe('newest');
    expect(ids(sample)).not.toContain('gone');
  });

  it('every sampleData key exists in a real run item', async () => {
    addItem({ id: 'seed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    addItem({ id: 'real' });
    const [real] = await trigger.run(hookContext({ store }));
    for (const key of Object.keys(Object(trigger.sampleData))) {
      expect(real).toHaveProperty(key);
    }
  });
});
