import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { AppConnectionType, AppConnectionValueForAuthProperty, TriggerStrategy } from '@activepieces/pieces-framework';
import { googleTasksAuth } from '../src/lib/auth';
import { newTaskTrigger } from '../src/lib/triggers/new-task';

type VendorTask = {
  kind: 'tasks#task';
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  updated: string;
  position: string;
  notes?: string;
  due?: string;
  completed?: string;
  hidden?: boolean;
  deleted?: boolean;
};

const vendor = {
  lists: new Map<string, VendorTask[]>(),
  pageSize: 100,
  calls: 0,
  failNext: false,
  msPerCall: 0,
  delayMs: 0,
  rejectPageTokens: false,
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');
const tick = (minutes = 1) => {
  clock += minutes * 60_000;
  vi.setSystemTime(clock);
  return new Date(clock).toISOString();
};

function listOf({ list }: { list: string }): VendorTask[] {
  const existing = vendor.lists.get(list);
  if (existing) return existing;
  const created: VendorTask[] = [];
  vendor.lists.set(list, created);
  return created;
}

function addTask({ id, at, list = 'list-1' }: { id: string; at?: string; list?: string }) {
  const tasks = listOf({ list });
  tasks.push({
    kind: 'tasks#task',
    id,
    title: `Task ${id}`,
    status: 'needsAction',
    updated: at ?? tick(),
    position: String(tasks.length).padStart(20, '0'),
  });
}

function findTask({ id, list = 'list-1' }: { id: string; list?: string }): VendorTask {
  const task = listOf({ list }).find((candidate) => candidate.id === id);
  if (!task) throw new Error(`no task ${id}`);
  return task;
}

function editTask({ id, change }: { id: string; change: Partial<VendorTask> }) {
  Object.assign(findTask({ id }), change, { updated: tick() });
}

function installFakeVendor() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      vendor.calls += 1;
      if (vendor.delayMs > 0) {
        await waitOrAbort({ ms: vendor.delayMs, signal: init?.signal ?? undefined });
      }
      if (vendor.msPerCall > 0) {
        clock += vendor.msPerCall;
        vi.setSystemTime(clock);
      }
      if (vendor.failNext) {
        vendor.failNext = false;
        return new Response(JSON.stringify({ error: { code: 503, message: 'Backend Error' } }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        });
      }
      const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url);
      const match = /^\/tasks\/v1\/lists\/([^/]+)\/tasks$/.exec(url.pathname);
      if (url.host !== 'tasks.googleapis.com' || !match) {
        throw new Error(`unexpected request ${url}`);
      }
      const params = url.searchParams;
      if (vendor.rejectPageTokens && params.get('pageToken') !== null) {
        return new Response(JSON.stringify({ error: { code: 400, message: 'Invalid page token' } }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }
      const updatedMin = params.get('updatedMin');
      const showHidden = params.get('showHidden') === 'true';
      const showCompleted = params.get('showCompleted') !== 'false';
      const showDeleted = params.get('showDeleted') === 'true';
      const maxResults = Math.min(Number(params.get('maxResults') ?? 20), vendor.pageSize);
      const offset = Number(params.get('pageToken') ?? 0);
      const visible = listOf({ list: decodeURIComponent(match[1]) }).filter(
        (task) =>
          (updatedMin === null || Date.parse(task.updated) >= Date.parse(updatedMin)) &&
          (showHidden || task.hidden !== true) &&
          (showCompleted || task.status !== 'completed') &&
          (showDeleted || task.deleted !== true),
      );
      const page = visible.slice(offset, offset + maxResults);
      const next = offset + maxResults < visible.length ? String(offset + maxResults) : undefined;
      return new Response(
        JSON.stringify({ kind: 'tasks#tasks', etag: 'e', items: page.map((task) => ({ ...task })), ...(next ? { nextPageToken: next } : {}) }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }),
  );
}

function waitOrAbort({ ms, signal }: { ms: number; signal?: AbortSignal }): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('This operation was aborted', 'AbortError'));
    });
  });
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

type HookStore = ReturnType<typeof memoryStore>['store'];

const auth: AppConnectionValueForAuthProperty<typeof googleTasksAuth> = {
  type: AppConnectionType.OAUTH2,
  access_token: 'ya29.test',
  refresh_token: 'refresh',
  token_type: 'Bearer',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://example.com/redirect',
  claimed_at: 0,
  scope: 'https://www.googleapis.com/auth/tasks',
  token_url: 'https://oauth2.googleapis.com/token',
  props: {},
  data: {},
};

function hookContext({
  store,
  isRepublish,
  runOn = 'new_only',
  list = 'list-1',
}: {
  store: HookStore;
  isRepublish?: boolean;
  runOn?: string;
  list?: string;
}) {
  return {
    ...createMockPollingTriggerContext<typeof newTaskTrigger.props>({ propsValue: { tasks_list: list, run_on: runOn, info: undefined } }),
    auth,
    store,
    files: createMockActionContext({ propsValue: {} }).files,
    isRepublish,
  };
}

const trigger = pollingTrigger();

function pollingTrigger() {
  if (newTaskTrigger.type !== TriggerStrategy.POLLING) {
    throw new Error('expected a polling trigger');
  }
  return newTaskTrigger;
}

function field({ event, key }: { event: unknown; key: string }): unknown {
  if (typeof event !== 'object' || event === null || !(key in event)) {
    throw new Error(`event has no ${key}`);
  }
  return Object.entries(event).find(([name]) => name === key)?.[1];
}

const ids = (events: unknown[]) => events.map((event) => String(field({ event, key: 'id' })));

function storedState({ data }: { data: Map<string, string> }): {
  seen: string;
  cursorMs: number;
  prunedAtMs: number;
  pending: { pageToken: string; startedAtMs: number } | null;
  scan: { pageToken: string; windowMinMs: number; startedAtMs: number; maxUpdatedMs: number } | null;
} {
  const raw = data.get('new_task_state');
  if (raw === undefined) throw new Error('no state');
  return JSON.parse(raw);
}

beforeEach(() => {
  vendor.lists.clear();
  vendor.calls = 0;
  vendor.failNext = false;
  vendor.msPerCall = 0;
  vendor.delayMs = 0;
  vendor.rejectPageTokens = false;
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(clock);
  installFakeVendor();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Google Tasks New Task behaviour (Run on = new_only)', () => {
  it('fires once per new task across polls, never for tasks that existed at enable, and survives a republish', async () => {
    addTask({ id: 'old-1' });
    addTask({ id: 'old-2' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    addTask({ id: 'new-1' });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['new-1']);
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    addTask({ id: 'new-2' });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['new-2']);
  });

  it('does not fire for renames, notes, due dates, completions, hidden completions or moves', async () => {
    addTask({ id: 'a' });
    addTask({ id: 'b' });
    addTask({ id: 'c' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    editTask({ id: 'a', change: { title: 'Renamed' } });
    editTask({ id: 'a', change: { notes: 'More notes' } });
    editTask({ id: 'b', change: { due: '2026-11-20T00:00:00.000Z' } });
    editTask({ id: 'b', change: { status: 'completed', completed: new Date(clock).toISOString() } });
    editTask({ id: 'c', change: { status: 'completed', completed: new Date(clock).toISOString(), hidden: true } });
    editTask({ id: 'c', change: { status: 'needsAction', hidden: false } });
    editTask({ id: 'a', change: { position: '00000000000000000099' } });
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('fires once for a task created and completed in the Google app before the next poll', async () => {
    addTask({ id: 'seed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    addTask({ id: 'quick' });
    editTask({ id: 'quick', change: { status: 'completed', hidden: true } });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['quick']);
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('does not fire for a hidden task that existed at enable when it is un-completed', async () => {
    addTask({ id: 'done' });
    editTask({ id: 'done', change: { status: 'completed', hidden: true } });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    editTask({ id: 'done', change: { status: 'needsAction', hidden: false } });
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('fires for both tasks that share one updated millisecond when the second shows up a poll later', async () => {
    addTask({ id: 'seed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const sameTime = tick();
    addTask({ id: 'tie-a', at: sameTime });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['tie-a']);
    addTask({ id: 'tie-b', at: sameTime });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['tie-b']);
    addTask({ id: 'late', at: new Date(Date.parse(sameTime) - 10_000).toISOString() });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['late']);
  });

  it('pages through 250 new tasks and fires each once, newest first', async () => {
    addTask({ id: 'seed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const burst = Array.from({ length: 250 }, (_, index) => `burst-${index}`);
    burst.forEach((id) => addTask({ id }));
    tick(5);
    const fired = ids(await trigger.run(hookContext({ store })));
    expect(fired).toEqual([...burst].reverse());
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('keeps unsent tasks for the next poll when the poll deadline cuts paging short', async () => {
    addTask({ id: 'seed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const burst = Array.from({ length: 250 }, (_, index) => `burst-${index}`);
    burst.forEach((id) => addTask({ id }));
    tick(5);
    vendor.msPerCall = 25_000;
    const first = ids(await trigger.run(hookContext({ store })));
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThan(burst.length);
    vendor.msPerCall = 0;
    tick(5);
    const second = ids(await trigger.run(hookContext({ store })));
    expect([...first, ...second].sort()).toEqual([...burst].sort());
  });

  it('re-baselines when the watched list changes on republish', async () => {
    addTask({ id: 'a-1' });
    addTask({ id: 'b-1', list: 'list-2' });
    addTask({ id: 'b-2', list: 'list-2' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true, list: 'list-2' }));
    tick(5);
    expect(await trigger.run(hookContext({ store, list: 'list-2' }))).toEqual([]);
    addTask({ id: 'b-3', list: 'list-2' });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store, list: 'list-2' })))).toEqual(['b-3']);
  });

  it('re-baselines when an existing flow switches Run on to new_only', async () => {
    addTask({ id: 'a' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn: 'new_and_edited' }));
    editTask({ id: 'a', change: { title: 'Edited before switch' } });
    await trigger.onDisable(hookContext({ store, isRepublish: true, runOn: 'new_only' }));
    await trigger.onEnable(hookContext({ store, isRepublish: true, runOn: 'new_only' }));
    editTask({ id: 'a', change: { title: 'Edited after switch' } });
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('keeps its state when onDisable runs without isRepublish before a republish, as older servers do', async () => {
    addTask({ id: 'a' });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    const before = data.get('new_task_state');
    addTask({ id: 'during-republish' });
    await trigger.onDisable(hookContext({ store }));
    expect(data.get('new_task_state')).toBe(before);
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    expect(data.get('new_task_state')).toBe(before);
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['during-republish']);
  });

  it('starts from now again when the flow is turned off and on', async () => {
    addTask({ id: 'a' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    await trigger.onDisable(hookContext({ store }));
    addTask({ id: 'while-off' });
    await trigger.onEnable(hookContext({ store }));
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('throws on a vendor error and leaves its state untouched so the next poll retries', async () => {
    addTask({ id: 'seed' });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    addTask({ id: 'new-1' });
    tick(5);
    const before = data.get('new_task_state');
    vendor.failNext = true;
    await expect(trigger.run(hookContext({ store }))).rejects.toThrow();
    expect(data.get('new_task_state')).toBe(before);
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['new-1']);
  });

  it('does not let a future updated value stall the cursor', async () => {
    addTask({ id: 'seed' });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    addTask({ id: 'future', at: '2030-01-01T00:00:00.000Z' });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['future']);
    expect(storedState({ data }).cursorMs).toBeLessThanOrEqual(clock);
    addTask({ id: 'after' });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['after']);
  });
});

describe('Google Tasks New Task seen-id cap and store size', () => {
  it('drops the oldest ids over 20 000 without a full listing when pruned less than a day ago, and stays under 512 KiB', async () => {
    Array.from({ length: 19_990 }, (_, index) => `old-${index}`).forEach((id) =>
      addTask({ id, at: '2026-10-01T00:00:00.000Z' }),
    );
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const fresh = Array.from({ length: 20 }, (_, index) => `fresh-${index}`);
    fresh.forEach((id) => addTask({ id }));
    tick(5);
    const callsBefore = vendor.calls;
    expect(ids(await trigger.run(hookContext({ store })))).toHaveLength(20);
    expect(vendor.calls - callsBefore).toBe(1);
    expect(storedState({ data }).seen.length).toBe(20_000 * 8);
    const raw = data.get('new_task_state') ?? '';
    expect(raw.length * 2).toBeLessThan(512 * 1024);
  });

  it('prunes ids of deleted tasks with one full listing a day once over the cap', async () => {
    Array.from({ length: 19_990 }, (_, index) => `old-${index}`).forEach((id) =>
      addTask({ id, at: '2026-10-01T00:00:00.000Z' }),
    );
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    listOf({ list: 'list-1' }).slice(0, 50).forEach((task) => {
      task.deleted = true;
    });
    tick(60 * 25);
    const fresh = Array.from({ length: 60 }, (_, index) => `fresh-${index}`);
    fresh.forEach((id) => addTask({ id }));
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toHaveLength(60);
    const state = storedState({ data });
    expect(state.seen.length).toBe(20_000 * 8);
    expect(state.prunedAtMs).toBe(clock);
    editTask({ id: 'old-100', change: { title: 'still known' } });
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });
});

describe('Google Tasks New Task behaviour (Run on = new_and_edited and legacy)', () => {
  it('fires once per edit and keeps hidden completions out, as on main', async () => {
    addTask({ id: 'a' });
    addTask({ id: 'b' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn: 'new_and_edited' }));
    editTask({ id: 'a', change: { title: 'Renamed' } });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store, runOn: 'new_and_edited' })))).toEqual(['a']);
    tick(5);
    expect(await trigger.run(hookContext({ store, runOn: 'new_and_edited' }))).toEqual([]);
    editTask({ id: 'b', change: { status: 'completed', hidden: true } });
    tick(5);
    expect(await trigger.run(hookContext({ store, runOn: 'new_and_edited' }))).toEqual([]);
  });

  it('fires for both edits that share one updated millisecond when the second shows up a poll later', async () => {
    addTask({ id: 'a' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn: 'new_and_edited' }));
    const sameTime = tick();
    addTask({ id: 'tie-a', at: sameTime });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store, runOn: 'new_and_edited' })))).toEqual(['tie-a']);
    addTask({ id: 'tie-b', at: sameTime });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store, runOn: 'new_and_edited' })))).toEqual(['tie-b']);
    addTask({ id: 'late', at: new Date(Date.parse(sameTime) - 10_000).toISOString() });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store, runOn: 'new_and_edited' })))).toEqual(['late']);
    tick(5);
    expect(await trigger.run(hookContext({ store, runOn: 'new_and_edited' }))).toEqual([]);
  });

  it('a future updated value fires once and does not stall later edits', async () => {
    addTask({ id: 'seed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn: 'new_and_edited' }));
    addTask({ id: 'future', at: '2030-01-01T00:00:00.000Z' });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store, runOn: 'new_and_edited' })))).toEqual(['future']);
    tick(5);
    expect(await trigger.run(hookContext({ store, runOn: 'new_and_edited' }))).toEqual([]);
    editTask({ id: 'seed', change: { title: 'edited' } });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store, runOn: 'new_and_edited' })))).toEqual(['seed']);
  });

  it('keeps the stored lastPoll of a flow enabled before the upgrade across a republish', async () => {
    addTask({ id: 'a' });
    const { store, data } = memoryStore();
    data.set('lastPoll', JSON.stringify(clock));
    editTask({ id: 'a', change: { title: 'Edited during republish' } });
    await trigger.onDisable(hookContext({ store, isRepublish: true, runOn: '' }));
    await trigger.onEnable(hookContext({ store, isRepublish: true, runOn: '' }));
    expect(data.has('lastPoll')).toBe(false);
    tick(5);
    expect(ids(await trigger.run(hookContext({ store, runOn: '' })))).toEqual(['a']);
    tick(5);
    expect(await trigger.run(hookContext({ store, runOn: '' }))).toEqual([]);
  });

  it('deletes lastPoll once a pre-upgrade flow is migrated, so an unreadable state later cannot replay old edits', async () => {
    addTask({ id: 'a' });
    const { store, data } = memoryStore();
    data.set('lastPoll', JSON.stringify(clock));
    editTask({ id: 'a', change: { title: 'Edited after the last main poll' } });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store, runOn: '' })))).toEqual(['a']);
    expect(data.has('lastPoll')).toBe(false);
    expect(data.has('new_task_state')).toBe(true);
    data.set('new_task_state', JSON.stringify({ v: 2 }));
    tick(5);
    expect(await trigger.run(hookContext({ store, runOn: '' }))).toEqual([]);
    tick(5);
    expect(await trigger.run(hookContext({ store, runOn: '' }))).toEqual([]);
  });

  it('fires a task created between the last old-version poll and an upgrade to new_only', async () => {
    addTask({ id: 'before-last-poll' });
    const { store, data } = memoryStore();
    tick(1);
    data.set('lastPoll', JSON.stringify(clock));
    tick(3);
    addTask({ id: 'call-the-dentist' });
    tick(1);
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    expect(data.has('lastPoll')).toBe(false);
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['call-the-dentist']);
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    editTask({ id: 'call-the-dentist', change: { title: 'Edited' } });
    editTask({ id: 'before-last-poll', change: { title: 'Edited' } });
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('starts from now, like main, when the upgrade publishes without isRepublish, even if the list changed', async () => {
    for (const runOn of ['new_only', '']) {
      vendor.lists.clear();
      addTask({ id: 'old' });
      addTask({ id: 'other-list-task', list: 'list-2' });
      const { store, data } = memoryStore();
      data.set('lastPoll', JSON.stringify(clock - 60_000));
      tick(3);
      addTask({ id: 'gap', list: 'list-2' });
      tick(1);
      await trigger.onDisable(hookContext({ store, isRepublish: false, runOn, list: 'list-2' }));
      await trigger.onEnable(hookContext({ store, isRepublish: false, runOn, list: 'list-2' }));
      expect(data.has('lastPoll')).toBe(false);
      tick(5);
      expect(await trigger.run(hookContext({ store, runOn, list: 'list-2' }))).toEqual([]);
      addTask({ id: 'after-enable', list: 'list-2' });
      tick(5);
      expect(ids(await trigger.run(hookContext({ store, runOn, list: 'list-2' })))).toEqual(['after-enable']);
    }
  });

  it('starts from now when a flow turned off before the upgrade is turned on again', async () => {
    for (const runOn of ['new_only', '']) {
      vendor.lists.clear();
      addTask({ id: 'old' });
      const { store, data } = memoryStore();
      tick(1);
      data.set('lastPoll', JSON.stringify(clock));
      tick(30);
      addTask({ id: 'while-off' });
      editTask({ id: 'old', change: { title: 'Edited while off' } });
      tick(60);
      await trigger.onEnable(hookContext({ store, runOn }));
      expect(data.has('lastPoll')).toBe(false);
      tick(5);
      expect(await trigger.run(hookContext({ store, runOn }))).toEqual([]);
      addTask({ id: 'after-enable' });
      tick(5);
      expect(ids(await trigger.run(hookContext({ store, runOn })))).toEqual(['after-enable']);
    }
  });

  it('fires a task created in the upgrade gap when the new_only baseline needs several polls', async () => {
    Array.from({ length: 300 }, (_, index) => `old-${index}`).forEach((id) =>
      addTask({ id, at: '2026-10-01T00:00:00.000Z' }),
    );
    const { store, data } = memoryStore();
    data.set('lastPoll', JSON.stringify(clock));
    tick(3);
    addTask({ id: 'gap' });
    tick(1);
    vendor.msPerCall = 50_000;
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    vendor.msPerCall = 0;
    expect(storedState({ data }).pending).not.toBeNull();
    for (let poll = 0; poll < 5 && storedState({ data }).pending !== null; poll += 1) {
      tick(5);
      expect(await trigger.run(hookContext({ store }))).toEqual([]);
    }
    expect(storedState({ data }).pending).toBeNull();
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['gap']);
  });

  it('starts from the stored lastPoll when the first new_only event after the upgrade is a poll', async () => {
    addTask({ id: 'old' });
    const { store, data } = memoryStore();
    data.set('lastPoll', JSON.stringify(clock));
    tick(3);
    addTask({ id: 'gap' });
    tick(1);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['gap']);
  });

  it('rejects an unknown Run on value', async () => {
    const { store } = memoryStore();
    await expect(trigger.run(hookContext({ store, runOn: 'yes' }))).rejects.toThrow('Run on');
  });
});

describe('Google Tasks New Task test()', () => {
  it('returns the newest tasks first with Run on blank, and no deleted tasks', async () => {
    addTask({ id: 'older' });
    addTask({ id: 'newest' });
    addTask({ id: 'gone' });
    findTask({ id: 'gone' }).deleted = true;
    findTask({ id: 'older' }).position = '99999999999999999999';
    const { store } = memoryStore();
    const sample = ids(await trigger.test(hookContext({ store, runOn: '' })));
    expect(sample).toEqual(['newest', 'older']);
  });

  it('caps the sample at five tasks', async () => {
    Array.from({ length: 8 }, (_, index) => `t-${index}`).forEach((id) => addTask({ id }));
    const { store } = memoryStore();
    expect(ids(await trigger.test(hookContext({ store })))).toEqual(['t-7', 't-6', 't-5', 't-4', 't-3']);
  });
});

describe('Google Tasks New Task baselines and prune under the time budget', () => {
  it('a run()-time baseline stops at the poll budget, resumes next poll, and never fires old tasks', async () => {
    Array.from({ length: 250 }, (_, index) => `old-${index}`).forEach((id) => addTask({ id }));
    const { store, data } = memoryStore();
    vendor.msPerCall = 25_000;
    const startedAt = clock;
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    expect(vendor.calls).toBe(2);
    expect(storedState({ data }).pending).toEqual({ pageToken: '200', startedAtMs: startedAt, seenUntilMs: null });
    vendor.msPerCall = 0;
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    expect(storedState({ data }).pending).toBeNull();
    expect(storedState({ data }).seen.length).toBe(250 * 8);
    editTask({ id: 'old-3', change: { title: 'Renamed' } });
    addTask({ id: 'new-1' });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['new-1']);
  });

  it('an onEnable baseline that runs out of time finishes on later polls', async () => {
    Array.from({ length: 450 }, (_, index) => `old-${index}`).forEach((id) => addTask({ id }));
    const { store, data } = memoryStore();
    vendor.msPerCall = 50_000;
    await trigger.onEnable(hookContext({ store }));
    expect(storedState({ data }).pending?.pageToken).toBe('300');
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    vendor.msPerCall = 0;
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    expect(storedState({ data }).pending).toBeNull();
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('restarts a pending baseline from the first page when Google rejects the saved page token', async () => {
    Array.from({ length: 250 }, (_, index) => `old-${index}`).forEach((id) => addTask({ id }));
    const { store, data } = memoryStore();
    vendor.msPerCall = 25_000;
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    vendor.msPerCall = 0;
    vendor.rejectPageTokens = true;
    tick(5);
    await expect(trigger.run(hookContext({ store }))).rejects.toThrow();
    expect(storedState({ data }).pending?.pageToken).toBe('');
    vendor.rejectPageTokens = false;
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    expect(storedState({ data }).pending).toBeNull();
    tick(5);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('retries an incomplete prune after an hour instead of a full day', async () => {
    Array.from({ length: 19_995 }, (_, index) => `old-${index}`).forEach((id) =>
      addTask({ id, at: '2026-10-01T00:00:00.000Z' }),
    );
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    tick(60 * 25);
    Array.from({ length: 10 }, (_, index) => `fresh-${index}`).forEach((id) => addTask({ id }));
    tick(5);
    vendor.msPerCall = 15_000;
    expect(ids(await trigger.run(hookContext({ store })))).toHaveLength(10);
    const retryAtMs = storedState({ data }).prunedAtMs + 24 * 60 * 60_000;
    expect(retryAtMs).toBeGreaterThan(clock + 59 * 60_000);
    expect(retryAtMs).toBeLessThanOrEqual(clock + 60 * 60_000);
    expect(storedState({ data }).seen.length).toBe(20_000 * 8);
    vendor.msPerCall = 0;
    addTask({ id: 'later' });
    tick(5);
    const callsBefore = vendor.calls;
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['later']);
    expect(vendor.calls - callsBefore).toBe(1);
    tick(60);
    addTask({ id: 'after-an-hour' });
    const retryCallsBefore = vendor.calls;
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['after-an-hour']);
    expect(vendor.calls - retryCallsBefore).toBeGreaterThan(1);
    expect(storedState({ data }).prunedAtMs).toBe(clock);
  });
});

describe('Google Tasks New Task polls that keep hitting the time budget', () => {
  it('resumes the same query window across slow polls and delivers every new task exactly once (new_only)', async () => {
    addTask({ id: 'seed' });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const burst = Array.from({ length: 650 }, (_, index) => `burst-${index}`);
    burst.forEach((id) => addTask({ id }));
    tick(5);
    const cursorBefore = storedState({ data }).cursorMs;
    vendor.msPerCall = 25_000;
    const fired: string[] = [];
    for (let poll = 0; poll < 3; poll += 1) {
      const batch = ids(await trigger.run(hookContext({ store })));
      expect(batch.length).toBeGreaterThanOrEqual(199);
      expect(batch.length).toBeLessThanOrEqual(200);
      fired.push(...batch);
      expect(storedState({ data }).scan).not.toBeNull();
      expect(storedState({ data }).cursorMs).toBe(cursorBefore);
      addTask({ id: `during-${poll}` });
      tick(5);
    }
    fired.push(...ids(await trigger.run(hookContext({ store }))));
    expect(storedState({ data }).scan).toBeNull();
    expect(storedState({ data }).cursorMs).toBeGreaterThan(cursorBefore);
    for (let poll = 0; poll < 3; poll += 1) {
      tick(5);
      fired.push(...ids(await trigger.run(hookContext({ store }))));
    }
    const expected = [...burst, 'during-0', 'during-1', 'during-2'];
    expect([...fired].sort()).toEqual([...expected].sort());
    expect(new Set(fired).size).toBe(fired.length);
  });

  it('resumes the same query window across slow polls and fires each edit exactly once (new_and_edited)', async () => {
    const existing = Array.from({ length: 450 }, (_, index) => `old-${index}`);
    existing.forEach((id) => addTask({ id }));
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn: 'new_and_edited' }));
    existing.forEach((id) => editTask({ id, change: { title: `${id} edited` } }));
    tick(5);
    vendor.msPerCall = 25_000;
    const fired: string[] = [];
    for (let poll = 0; poll < 6; poll += 1) {
      fired.push(...ids(await trigger.run(hookContext({ store, runOn: 'new_and_edited' }))));
      tick(5);
    }
    expect([...fired].sort()).toEqual([...existing].sort());
  });
});

describe('Google Tasks New Task with requests aborted at the deadline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(clock);
  });

  it('keeps the pages read before the deadline abort and resumes the baseline from the next page', async () => {
    Array.from({ length: 500 }, (_, index) => `old-${index}`).forEach((id) =>
      addTask({ id, at: '2026-10-01T00:00:00.000Z' }),
    );
    const { store, data } = memoryStore();
    vendor.delayMs = 9_000;
    const first = trigger.run(hookContext({ store }));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await first).toEqual([]);
    expect(vendor.calls).toBe(5);
    expect(storedState({ data }).pending?.pageToken).toBe('400');
    expect(storedState({ data }).seen.length).toBe(400 * 8);
    vendor.delayMs = 0;
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    expect(storedState({ data }).pending).toBeNull();
    expect(storedState({ data }).seen.length).toBe(500 * 8);
    clock = Date.now();
    addTask({ id: 'new-1' });
    tick(5);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['new-1']);
  });

  it('still throws when a single request times out before the overall deadline', async () => {
    addTask({ id: 'a' });
    const { store } = memoryStore();
    vendor.delayMs = 25_000;
    const enabling = trigger.onEnable(hookContext({ store }));
    const outcome = expect(enabling).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(30_000);
    await outcome;
  });

  it('test() throws a clear error instead of returning older tasks when the list cannot be read in time', async () => {
    Array.from({ length: 2_500 }, (_, index) => `t-${index}`).forEach((id) =>
      addTask({ id, at: '2026-10-01T00:00:00.000Z' }),
    );
    const { store } = memoryStore();
    vendor.delayMs = 9_000;
    const sampling = trigger.test(hookContext({ store }));
    const outcome = expect(sampling).rejects.toThrow('too large to load a sample in time');
    await vi.advanceTimersByTimeAsync(200_000);
    await outcome;
  });
});

describe('Google Tasks New Task edits that land during a long resumed scan', () => {
  it.each([
    { label: 'new_and_edited, edits on pages not read yet', runOn: 'new_and_edited', ahead: true },
    { label: 'Run on unset, edits on pages not read yet', runOn: '', ahead: true },
    { label: 'new_and_edited, edits on pages already read', runOn: 'new_and_edited', ahead: false },
    { label: 'Run on unset, edits on pages already read', runOn: '', ahead: false },
  ])('fires each of 6,000 mid-scan edits exactly once ($label)', async ({ runOn, ahead }) => {
    const total = 6_500;
    const all = Array.from({ length: total }, (_, index) => `t-${index}`);
    all.forEach((id) => addTask({ id, at: '2026-10-01T00:00:00.000Z' }));
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn }));
    all.forEach((id) => editTask({ id, change: { title: `${id} first edit` } }));
    tick(5);
    vendor.msPerCall = 25_000;
    const emitted: string[] = [];
    const midScanEdits: string[] = [];
    const record = (events: unknown[]) =>
      events.forEach((event) =>
        emitted.push(`${String(field({ event, key: 'id' }))}|${String(field({ event, key: 'updated' }))}`),
      );
    record(await trigger.run(hookContext({ store, runOn })));
    let next = 0;
    while (storedState({ data }).scan !== null) {
      for (let index = 0; index < 200 && midScanEdits.length < 6_000; index += 1) {
        const id = all[ahead ? total - 1 - next : next];
        next += 1;
        editTask({ id, change: { title: `${id} mid-scan edit` } });
        midScanEdits.push(`${id}|${findTask({ id }).updated}`);
      }
      record(await trigger.run(hookContext({ store, runOn })));
    }
    expect(midScanEdits).toHaveLength(6_000);
    for (let poll = 0; poll < 80; poll += 1) {
      tick(5);
      record(await trigger.run(hookContext({ store, runOn })));
    }
    expect(storedState({ data }).scan).toBeNull();
    expect(new Set(emitted).size).toBe(emitted.length);
    const emittedSet = new Set(emitted);
    expect(midScanEdits.filter((key) => !emittedSet.has(key))).toEqual([]);
  });
});

async function runOverlapScenario({ runOn, perGroup }: { runOn: string; perGroup: number }) {
  const fresh = Array.from({ length: perGroup }, (_, index) => `n-${index}`);
  const old = Array.from({ length: perGroup }, (_, index) => `o-${index}`);
  [...fresh, ...old].forEach((id) => addTask({ id, at: '2026-10-01T00:00:00.000Z' }));
  const { store, data } = memoryStore();
  await trigger.onEnable(hookContext({ store, runOn }));
  const oldTime = Date.parse(tick(2));
  old.forEach((id, index) => {
    findTask({ id }).updated = new Date(oldTime + (index % 60) * 1_000).toISOString();
  });
  tick(2);
  const emitted: string[] = [];
  const record = (events: unknown[]) =>
    events.forEach((event) =>
      emitted.push(`${String(field({ event, key: 'id' }))}|${String(field({ event, key: 'updated' }))}`),
    );
  record(await trigger.run(hookContext({ store, runOn })));
  const freshTime = Date.parse(tick(5));
  fresh.forEach((id, index) => {
    findTask({ id }).updated = new Date(freshTime + (index % 60) * 1_000).toISOString();
  });
  tick(2);
  vendor.msPerCall = 25_000;
  let maxStateChars = 0;
  let scanPolls = 0;
  do {
    record(await trigger.run(hookContext({ store, runOn })));
    maxStateChars = Math.max(maxStateChars, (data.get('new_task_state') ?? '').length);
    scanPolls += 1;
  } while (storedState({ data }).scan !== null);
  vendor.msPerCall = 0;
  for (let poll = 0; poll < 3; poll += 1) {
    tick(5);
    record(await trigger.run(hookContext({ store, runOn })));
  }
  const freshKeys = fresh.map((id) => `${id}|${findTask({ id }).updated}`);
  const oldKeys = old.map((id) => `${id}|${findTask({ id }).updated}`);
  return { emitted, freshKeys, oldKeys, maxStateChars, scanPolls };
}

describe('Google Tasks New Task dedupe keys for the old and the new cursor', () => {
  it.each([
    { label: 'new_and_edited', runOn: 'new_and_edited' },
    { label: 'Run on unset', runOn: '' },
  ])('3,000 keys near the old cursor and 3,000 edits five minutes later each fire exactly once ($label)', async ({ runOn }) => {
    const { emitted, freshKeys, oldKeys, scanPolls } = await runOverlapScenario({ runOn, perGroup: 3_000 });
    expect(scanPolls).toBeGreaterThan(1);
    expect(new Set(emitted).size).toBe(emitted.length);
    expect([...emitted].sort()).toEqual([...oldKeys, ...freshKeys].sort());
  });

  it('keeps the state under 512 KiB with 5,000 keys for each cursor', async () => {
    const { emitted, freshKeys, oldKeys, maxStateChars } = await runOverlapScenario({ runOn: 'new_and_edited', perGroup: 5_000 });
    expect([...emitted].sort()).toEqual([...oldKeys, ...freshKeys].sort());
    expect(maxStateChars).toBeGreaterThanOrEqual(10_000 * 17);
    expect(maxStateChars * 2).toBeLessThan(512 * 1024);
  });
});
