import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework';
import { googleTasksAuth } from '../src/lib/auth';
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { newTaskTrigger } from '../src/lib/triggers/new-task';

type VendorTask = {
  kind: 'tasks#task';
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  updated: string;
  position: string;
  notes?: string;
  completed?: string;
  hidden?: boolean;
  deleted?: boolean;
};

const vendor = {
  lists: new Map<string, VendorTask[]>(),
  pageSize: 100,
  calls: 0,
  failOnCall: 0,
  msPerCall: 0,
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');

function advance({ ms }: { ms: number }): string {
  clock += ms;
  vi.setSystemTime(clock);
  return new Date(clock).toISOString();
}

function listOf({ list }: { list: string }): VendorTask[] {
  const existing = vendor.lists.get(list);
  if (existing) return existing;
  const created: VendorTask[] = [];
  vendor.lists.set(list, created);
  return created;
}

function addTask({ id, at, list = 'list-1' }: { id: string; at?: string; list?: string }): VendorTask {
  const tasks = listOf({ list });
  const task: VendorTask = {
    kind: 'tasks#task',
    id,
    title: `Task ${id}`,
    status: 'needsAction',
    updated: at ?? new Date(clock).toISOString(),
    position: String(tasks.length).padStart(20, '0'),
  };
  tasks.push(task);
  return task;
}

function findTask({ id, list = 'list-1' }: { id: string; list?: string }): VendorTask {
  const task = listOf({ list }).find((candidate) => candidate.id === id);
  if (!task) throw new Error(`no task ${id}`);
  return task;
}

function editTask({ id, change, list = 'list-1' }: { id: string; change: Partial<VendorTask>; list?: string }) {
  Object.assign(findTask({ id, list }), change, { updated: new Date(clock).toISOString() });
}

function moveTask({ id, from, to }: { id: string; from: string; to: string }) {
  const source = listOf({ list: from });
  const index = source.findIndex((task) => task.id === id);
  const [task] = source.splice(index, 1);
  listOf({ list: to }).push({ ...task, updated: new Date(clock).toISOString() });
}

function installFakeVendor() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      vendor.calls += 1;
      if (vendor.msPerCall > 0) {
        advance({ ms: vendor.msPerCall });
      }
      if (vendor.failOnCall === vendor.calls) {
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
  runOn,
  list = 'list-1',
}: {
  store: HookStore;
  isRepublish?: boolean;
  runOn?: string | null;
  list?: string;
}) {
  const propsValue: StaticPropsValue<typeof newTaskTrigger.props> = JSON.parse(JSON.stringify({ tasks_list: list, run_on: runOn }));
  return {
    ...createMockPollingTriggerContext<typeof newTaskTrigger.props>({ propsValue }),
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

const keysOf = (events: unknown[]) =>
  events.map((event) => `${String(field({ event, key: 'id' }))}|${String(field({ event, key: 'updated' }))}`).sort();

async function mainItems({ list, lastFetchEpochMS }: { list: string; lastFetchEpochMS: number }) {
  const tasks: VendorTask[] = [];
  let pageToken: string | undefined;
  do {
    const query = new URLSearchParams({ maxResults: '100' });
    if (lastFetchEpochMS > 0) query.set('updatedMin', new Date(lastFetchEpochMS).toISOString());
    if (pageToken) query.set('pageToken', pageToken);
    const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${list}/tasks?${query}`);
    const body: { items?: VendorTask[]; nextPageToken?: string } = await response.json();
    tasks.push(...(body.items ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);
  return tasks
    .filter((task) => Date.parse(task.updated ?? '0') > lastFetchEpochMS)
    .map((task) => ({ epochMilliSeconds: Date.parse(task.updated ?? '0'), data: task }));
}

const mainPolling: Polling<typeof auth, { tasks_list: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS }) => mainItems({ list: propsValue.tasks_list, lastFetchEpochMS }),
};

function mainContext({ store }: { store: HookStore }) {
  return {
    store,
    auth,
    propsValue: { tasks_list: 'list-1' },
    files: createMockActionContext({ propsValue: {} }).files,
  };
}

function seededRandom({ seed }: { seed: number }) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function mutateRandomly({ random, step }: { random: () => number; step: number }) {
  const tasks = listOf({ list: 'list-1' });
  const roll = random();
  if (roll < 0.15) advance({ ms: 0 });
  else if (roll < 0.4) advance({ ms: Math.floor(random() * 2_000) });
  else advance({ ms: Math.floor(random() * 120_000) });
  const action = random();
  if (tasks.length === 0 || action < 0.35) {
    addTask({ id: `t-${step}-${tasks.length}` });
    return;
  }
  const target = tasks[Math.floor(random() * tasks.length)];
  if (action < 0.55) editTask({ id: target.id, change: { title: `Renamed ${step}` } });
  else if (action < 0.7) editTask({ id: target.id, change: { status: 'completed', completed: new Date(clock).toISOString() } });
  else if (action < 0.8) editTask({ id: target.id, change: { status: 'completed', hidden: true } });
  else if (action < 0.9) editTask({ id: target.id, change: { status: 'needsAction', hidden: false } });
  else editTask({ id: target.id, change: { position: String(step).padStart(20, '9') } });
}

beforeEach(() => {
  vendor.lists.clear();
  vendor.calls = 0;
  vendor.failOnCall = 0;
  vendor.msPerCall = 0;
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

describe('QA: upgraded flows with only lastPoll stored match main poll by poll', () => {
  const variants: { label: string; runOn: string | null | undefined; republish: boolean }[] = [
    { label: 'run_on undefined, first event is a poll', runOn: undefined, republish: false },
    { label: 'run_on null, first event is a poll', runOn: null, republish: false },
    { label: 'run_on empty, first event is a republish', runOn: '', republish: true },
  ];
  for (const variant of variants) {
    for (const seed of [1, 7, 42, 99, 2026]) {
      it(`${variant.label}, seed ${seed}`, async () => {
        const random = seededRandom({ seed });
        for (let index = 0; index < 5; index += 1) addTask({ id: `pre-${index}` });
        const mainStore = memoryStore();
        const newStore = memoryStore();
        await pollingHelper.onEnable(mainPolling, mainContext({ store: mainStore.store }));
        for (let step = 0; step < 15; step += 1) mutateRandomly({ random, step });
        advance({ ms: 60_000 });
        await pollingHelper.poll(mainPolling, mainContext({ store: mainStore.store }));
        newStore.data.set('lastPoll', mainStore.data.get('lastPoll') ?? 'null');
        if (variant.republish) {
          await trigger.onDisable(hookContext({ store: newStore.store, isRepublish: true, runOn: variant.runOn }));
          await trigger.onEnable(hookContext({ store: newStore.store, isRepublish: true, runOn: variant.runOn }));
        }
        let fired = 0;
        for (let poll = 0; poll < 12; poll += 1) {
          const burst = 1 + Math.floor(random() * 6);
          for (let step = 0; step < burst; step += 1) mutateRandomly({ random, step: poll * 100 + step });
          advance({ ms: Math.floor(random() * 90_000) });
          const expected = await pollingHelper.poll(mainPolling, mainContext({ store: mainStore.store }));
          const actual = await trigger.run(hookContext({ store: newStore.store, runOn: variant.runOn }));
          expect(keysOf(actual)).toEqual(keysOf(expected));
          fired += actual.length;
        }
        expect(fired).toBeGreaterThan(10);
      });
    }
  }

  it('does not re-fire anything on the first poll after the upgrade when nothing changed', async () => {
    for (let index = 0; index < 30; index += 1) {
      advance({ ms: 1_000 });
      addTask({ id: `pre-${index}` });
    }
    const { store, data } = memoryStore();
    data.set('lastPoll', JSON.stringify(clock));
    advance({ ms: 300_000 });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    advance({ ms: 300_000 });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('fires a task created after the last main poll but before the upgrade', async () => {
    addTask({ id: 'pre' });
    const { store, data } = memoryStore();
    data.set('lastPoll', JSON.stringify(clock));
    advance({ ms: 30_000 });
    addTask({ id: 'between' });
    advance({ ms: 30_000 });
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['between']);
  });
});

describe('QA: new_and_edited dedupe inside the 60 s overlap', () => {
  it('an edit at exactly the cursor time fires once, and a tie arriving late fires once', async () => {
    addTask({ id: 'seed' });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn: 'new_and_edited' }));
    const at = advance({ ms: 10_000 });
    editTask({ id: 'seed', change: { title: 'Edited at cursor' } });
    expect(ids(await trigger.run(hookContext({ store, runOn: 'new_and_edited' })))).toEqual(['seed']);
    expect(JSON.parse(data.get('new_task_state') ?? '{}').cursorMs).toBe(Date.parse(at));
    expect(await trigger.run(hookContext({ store, runOn: 'new_and_edited' }))).toEqual([]);
    advance({ ms: 20_000 });
    expect(await trigger.run(hookContext({ store, runOn: 'new_and_edited' }))).toEqual([]);
    addTask({ id: 'tie', at });
    expect(ids(await trigger.run(hookContext({ store, runOn: 'new_and_edited' })))).toEqual(['tie']);
    advance({ ms: 59_000 });
    expect(await trigger.run(hookContext({ store, runOn: 'new_and_edited' }))).toEqual([]);
    advance({ ms: 5_000 });
    editTask({ id: 'seed', change: { title: 'Edited again' } });
    expect(ids(await trigger.run(hookContext({ store, runOn: 'new_and_edited' })))).toEqual(['seed']);
    expect(await trigger.run(hookContext({ store, runOn: 'new_and_edited' }))).toEqual([]);
  });
});

describe('QA: new_only state handling', () => {
  it('seeds hidden and completed tasks at enable so un-hiding or re-opening them never fires', async () => {
    addTask({ id: 'open' });
    addTask({ id: 'done' });
    editTask({ id: 'done', change: { status: 'completed' } });
    addTask({ id: 'hidden' });
    editTask({ id: 'hidden', change: { status: 'completed', hidden: true } });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn: 'new_only' }));
    advance({ ms: 60_000 });
    editTask({ id: 'done', change: { status: 'needsAction' } });
    editTask({ id: 'hidden', change: { status: 'needsAction', hidden: false } });
    editTask({ id: 'open', change: { title: 'Renamed' } });
    advance({ ms: 60_000 });
    expect(await trigger.run(hookContext({ store, runOn: 'new_only' }))).toEqual([]);
  });

  it('a 503 on the second page throws and leaves the state byte-for-byte untouched', async () => {
    addTask({ id: 'seed' });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn: 'new_only' }));
    advance({ ms: 1_000 });
    const burst = Array.from({ length: 150 }, (_, index) => `b-${index}`);
    burst.forEach((id) => addTask({ id }));
    advance({ ms: 60_000 });
    const before = data.get('new_task_state');
    vendor.failOnCall = vendor.calls + 2;
    await expect(trigger.run(hookContext({ store, runOn: 'new_only' }))).rejects.toThrow();
    expect(data.get('new_task_state')).toBe(before);
    advance({ ms: 60_000 });
    expect(ids(await trigger.run(hookContext({ store, runOn: 'new_only' }))).sort()).toEqual([...burst].sort());
  });

  it('a poll cut short by the time budget keeps the cursor and sends the rest next poll', async () => {
    addTask({ id: 'seed' });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn: 'new_only' }));
    advance({ ms: 1_000 });
    const burst = Array.from({ length: 300 }, (_, index) => `b-${index}`);
    burst.forEach((id) => addTask({ id }));
    advance({ ms: 60_000 });
    const cursorBefore = JSON.parse(data.get('new_task_state') ?? '{}').cursorMs;
    vendor.msPerCall = 25_000;
    const first = ids(await trigger.run(hookContext({ store, runOn: 'new_only' })));
    expect(first.length).toBe(199);
    expect(JSON.parse(data.get('new_task_state') ?? '{}').cursorMs).toBe(cursorBefore);
    vendor.msPerCall = 0;
    advance({ ms: 60_000 });
    const second = ids(await trigger.run(hookContext({ store, runOn: 'new_only' })));
    expect(second.length).toBe(101);
    expect([...first, ...second].sort()).toEqual([...burst].sort());
    expect(JSON.parse(data.get('new_task_state') ?? '{}').cursorMs).toBeGreaterThan(cursorBefore);
  });

  it('a task moved to another watched list fires there once and does not fire again when moved back', async () => {
    addTask({ id: 'mover' });
    addTask({ id: 'other', list: 'list-2' });
    const one = memoryStore();
    const two = memoryStore();
    await trigger.onEnable(hookContext({ store: one.store, runOn: 'new_only' }));
    await trigger.onEnable(hookContext({ store: two.store, runOn: 'new_only', list: 'list-2' }));
    advance({ ms: 60_000 });
    moveTask({ id: 'mover', from: 'list-1', to: 'list-2' });
    advance({ ms: 60_000 });
    expect(await trigger.run(hookContext({ store: one.store, runOn: 'new_only' }))).toEqual([]);
    expect(ids(await trigger.run(hookContext({ store: two.store, runOn: 'new_only', list: 'list-2' })))).toEqual(['mover']);
    advance({ ms: 60_000 });
    moveTask({ id: 'mover', from: 'list-2', to: 'list-1' });
    advance({ ms: 60_000 });
    expect(await trigger.run(hookContext({ store: one.store, runOn: 'new_only' }))).toEqual([]);
    expect(await trigger.run(hookContext({ store: two.store, runOn: 'new_only', list: 'list-2' }))).toEqual([]);
  });

  it('keeps the whole state under 512 KiB at the cap by both the engine and the server size measures', async () => {
    const many = Array.from({ length: 20_050 }, (_, index) => `cap-${index}`);
    many.forEach((id) => addTask({ id }));
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store, runOn: 'new_only' }));
    const raw = data.get('new_task_state') ?? '';
    const state = JSON.parse(raw);
    expect(state.seen.length).toBe(20_000 * 8);
    expect(Buffer.byteLength(raw, 'utf8')).toBeLessThan(512 * 1024);
    expect(raw.length * 2).toBeLessThan(512 * 1024);
  });
});

describe('QA: test() and run() agree', () => {
  it('returns the same task object shape from test() with Run on blank and from run()', async () => {
    addTask({ id: 'seed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    advance({ ms: 5_000 });
    const task = addTask({ id: 'fresh' });
    task.notes = 'Some notes';
    advance({ ms: 5_000 });
    const fromRun = await trigger.run(hookContext({ store }));
    const fromTest = await trigger.test(hookContext({ store }));
    expect(ids(fromTest)[0]).toBe('fresh');
    expect(fromRun).toEqual([fromTest[0]]);
    expect(Object.keys(Object(fromRun[0])).sort()).toEqual(Object.keys(Object(fromTest[0])).sort());
  });
});
