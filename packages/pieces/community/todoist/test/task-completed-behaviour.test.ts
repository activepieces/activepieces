import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { todoistFake } from './todoist-fake';

const { MINUTE, DAY, vendor, trigger, advance, now, iso, complete, memoryStore, ctx, ids } = todoistFake;

async function lifecycleScenario() {
  complete({ id: 'old-1', at: now() - 2 * DAY });
  complete({ id: 'old-2', at: now() - 3 * MINUTE });
  const store = memoryStore();
  await trigger.onEnable(ctx({ store }));
  advance();
  expect(await trigger.run(ctx({ store }))).toEqual([]);
  complete({ id: 'new-1' });
  advance();
  expect(ids(await trigger.run(ctx({ store })))).toEqual(['new-1']);
  advance();
  expect(await trigger.run(ctx({ store }))).toEqual([]);
  await trigger.onDisable(ctx({ store, isRepublish: true }));
  await trigger.onEnable(ctx({ store, isRepublish: true }));
  advance();
  expect(await trigger.run(ctx({ store }))).toEqual([]);
  complete({ id: 'new-2' });
  advance();
  expect(ids(await trigger.run(ctx({ store })))).toEqual(['new-2']);
}

beforeEach(() => {
  todoistFake.reset();
});

afterEach(() => {
  todoistFake.restore();
});

describe('Todoist Task Completed behaviour', () => {
  it('fires once per completion across polls and a republish, never for completions before enable', async () => {
    await lifecycleScenario();
  });

  it.each(['America/Los_Angeles', 'Asia/Tokyo'])('behaves the same and sends UTC windows on a %s worker', async (tz) => {
    process.env.TZ = tz;
    await lifecycleScenario();
    for (const request of vendor.requests) {
      expect(request.since.endsWith('Z')).toBe(true);
      expect(request.until.endsWith('Z')).toBe(true);
    }
    const last = vendor.requests[vendor.requests.length - 1];
    expect(Date.parse(last.until)).toBeGreaterThan(now());
    expect(Date.parse(last.until) - now()).toBeLessThanOrEqual(1000);
  });

  it('fires both completions that share the same timestamp, even when the second shows up a poll later', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    advance();
    const sameTime = now() - 1000;
    complete({ id: 'tie-a', at: sameTime });
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['tie-a']);
    complete({ id: 'tie-b', at: sameTime });
    advance();
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['tie-b']);
    advance();
    expect(await trigger.run(ctx({ store }))).toEqual([]);
  });

  it('fires a completion that Todoist lists a few minutes after its completed_at', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    advance();
    complete({ id: 'fresh' });
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['fresh']);
    const lateAt = now() - 4 * MINUTE;
    advance();
    complete({ id: 'late', at: lateAt });
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['late']);
  });

  it('fires again when a task is reopened and completed a second time', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    advance();
    complete({ id: 'task-1' });
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['task-1']);
    advance();
    vendor.tasks = [];
    complete({ id: 'task-1' });
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['task-1']);
  });

  it('pages back to the checkpoint when more than one page of completions arrives between polls', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    advance(30);
    const burst = Array.from({ length: 205 }, (_, index) => `burst-${index}`);
    burst.forEach((id, index) => complete({ id, at: now() - (index + 1) * 5000 }));
    vendor.requests = [];
    const fired = ids(await trigger.run(ctx({ store })));
    expect(vendor.requests.length).toBeGreaterThan(1);
    expect(fired).toHaveLength(burst.length);
    expect(new Set(fired)).toEqual(new Set(burst));
    expect(fired[0]).toBe('burst-204');
    advance();
    expect(await trigger.run(ctx({ store }))).toEqual([]);
  });

  it('does not re-fire completions an older version already emitted (store with lastPoll only)', async () => {
    const lastPoll = now() - 10 * MINUTE;
    complete({ id: 'already-sent', at: lastPoll - 2 * MINUTE });
    complete({ id: 'at-cursor', at: lastPoll });
    complete({ id: 'after-cursor', at: lastPoll + MINUTE });
    const store = memoryStore({ lastPoll });
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['after-cursor']);
    advance();
    expect(await trigger.run(ctx({ store }))).toEqual([]);
  });

  it('keeps the window within the 3-month limit after a long pause', async () => {
    const store = memoryStore({ lastPoll: now() - 120 * DAY });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    complete({ id: 'recent', at: now() - DAY });
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['recent']);
    const [request] = vendor.requests;
    expect(Date.parse(request.until) - Date.parse(request.since)).toBeLessThanOrEqual(90 * DAY);
  });

  it('throws on a vendor error and keeps the cursor so nothing is skipped', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    advance();
    complete({ id: 'during-outage' });
    vendor.fail = true;
    await expect(trigger.run(ctx({ store }))).rejects.toThrow('Todoist 503');
    vendor.fail = false;
    advance();
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['during-outage']);
  });

  it('catches up a long backlog oldest first across polls when the poll deadline is hit, with no loss or repeats', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 60 * DAY, seen: [], projectId: null } });
    const backlog = Array.from({ length: 60 }, (_, index) => `day-${index}`);
    backlog.forEach((id, index) => complete({ id, at: now() - (60 - index) * DAY + MINUTE, visibleFrom: 0 }));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vendor.requestCostMs = 10_000;
    const first = ids(await trigger.run(ctx({ store })));
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThan(backlog.length);
    expect(first).toEqual(backlog.slice(0, first.length));
    const fired = [...first];
    for (let poll = 0; poll < 10 && fired.length < backlog.length; poll++) {
      advance();
      fired.push(...ids(await trigger.run(ctx({ store }))));
    }
    expect(fired).toEqual(backlog);
    advance();
    expect(await trigger.run(ctx({ store }))).toEqual([]);
  });

  it('re-baselines on republish when the project filter changes, and keeps the cursor when it does not', async () => {
    const twoDaysAgo = now() - 2 * DAY;
    complete({ id: 'recent-a', at: now() - DAY, visibleFrom: 0 });
    const changed = memoryStore({ taskCompletedState: { cursor: twoDaysAgo, seen: [], projectId: 'project-a' } });
    await trigger.onEnable(ctx({ store: changed, isRepublish: true, projectId: 'project-b' }));
    expect(vendor.requests[vendor.requests.length - 1].project_id).toBe('project-b');
    advance();
    expect(await trigger.run(ctx({ store: changed, projectId: 'project-b' }))).toEqual([]);
    const same = memoryStore({ taskCompletedState: { cursor: twoDaysAgo, seen: [], projectId: 'project-a' } });
    await trigger.onEnable(ctx({ store: same, isRepublish: true, projectId: 'project-a' }));
    expect(ids(await trigger.run(ctx({ store: same, projectId: 'project-a' })))).toEqual(['recent-a']);
  });

  it('writes the cursor and the seen set in one store write per poll', async () => {
    const store = memoryStore({ lastPoll: now() - 10 * MINUTE });
    complete({ id: 'one' });
    store.puts.length = 0;
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['one']);
    expect(store.puts).toEqual(['taskCompletedState']);
  });

  it('drains a week that holds more pages than one poll can fetch, each completion exactly once', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 20 * DAY, seen: [], projectId: null } });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const week = Array.from({ length: 6000 }, (_, index) => `w-${index}`);
    week.forEach((id, index) => complete({ id, at: now() - 20 * DAY + (index + 1) * MINUTE, visibleFrom: 0 }));
    vendor.requestCostMs = 1_000;
    const fired: string[] = ids(await trigger.run(ctx({ store })));
    const afterStall = await store.get<{ chunkMs: number }>('taskCompletedState');
    expect(afterStall?.chunkMs).toBeLessThan(7 * DAY);
    for (let poll = 0; poll < 40 && fired.length < week.length; poll++) {
      advance();
      fired.push(...ids(await trigger.run(ctx({ store }))));
    }
    expect(fired).toHaveLength(week.length);
    expect(new Set(fired)).toEqual(new Set(week));
    vendor.requestCostMs = 0;
    for (let poll = 0; poll < 4; poll++) {
      advance();
      expect(await trigger.run(ctx({ store }))).toEqual([]);
    }
    const recovered = await store.get<{ chunkMs: number; resume: unknown }>('taskCompletedState');
    expect(recovered?.chunkMs).toBe(7 * DAY);
    expect(recovered?.resume).toBeNull();
  });

  it('resumes paging inside a one-minute chunk that holds more pages than one poll can fetch', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 2 * DAY, seen: [], projectId: null, chunkMs: 60_000 } });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const sameMinute = now() - 2 * DAY + 30_000;
    const crowd = Array.from({ length: 6000 }, (_, index) => `m-${index}`);
    crowd.forEach((id) => complete({ id, at: sameMinute, visibleFrom: 0 }));
    vendor.requestCostMs = 1_000;
    const fired: string[] = [];
    for (let poll = 0; poll < 10 && fired.length < crowd.length; poll++) {
      fired.push(...ids(await trigger.run(ctx({ store }))));
      advance();
    }
    expect(fired).toHaveLength(crowd.length);
    expect(new Set(fired)).toEqual(new Set(crowd));
  });

  it('does not stall in steady state when the recent window holds more pages than a slow poll can fetch', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const expected: string[] = [];
    let next = 0;
    const addBatch = (count: number) => {
      for (let index = 0; index < count; index++) {
        const id = `s-${next++}`;
        expected.push(id);
        complete({ id, at: now() - (index + 1) * 1000 });
      }
    };
    advance(1);
    addBatch(650);
    vendor.requestCostMs = 12_000;
    const fired: string[] = [];
    for (let poll = 0; poll < 30; poll++) {
      advance();
      if (poll < 10) {
        addBatch(20);
      }
      fired.push(...ids(await trigger.run(ctx({ store }))));
    }
    expect(fired).toHaveLength(expected.length);
    expect(new Set(fired)).toEqual(new Set(expected));
    const state = await store.get<{ resume: unknown }>('taskCompletedState');
    expect(state?.resume).toBeNull();
  });

  it('restarts a resumed one-minute chunk when Todoist rejects the saved page cursor, without repeats', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 2 * DAY, seen: [], projectId: null, chunkMs: 60_000 } });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const sameMinute = now() - 2 * DAY + 30_000;
    const crowd = Array.from({ length: 6000 }, (_, index) => `m-${index}`);
    crowd.forEach((id) => complete({ id, at: sameMinute, visibleFrom: 0 }));
    vendor.requestCostMs = 1_000;
    const resumeCursor = async () => (await store.get<{ resume: { cursor: string } | null }>('taskCompletedState'))?.resume?.cursor;
    const fired: string[] = [];
    for (let poll = 0; poll < 20 && !(await resumeCursor()); poll++) {
      fired.push(...ids(await trigger.run(ctx({ store }))));
      advance();
    }
    expect(await resumeCursor()).toBeTruthy();
    vendor.staleCursorOnce = true;
    for (let poll = 0; poll < 10 && fired.length < crowd.length; poll++) {
      advance();
      fired.push(...ids(await trigger.run(ctx({ store }))));
    }
    expect(vendor.staleCursorOnce).toBe(false);
    expect(fired).toHaveLength(crowd.length);
    expect(new Set(fired)).toEqual(new Set(crowd));
  });

  it('skips the rest of a crowded minute instead of stalling when every saved page cursor has expired', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 2 * DAY, seen: [], projectId: null, chunkMs: 60_000 } });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const sameMinute = now() - 2 * DAY + 30_000;
    Array.from({ length: 6000 }, (_, index) => complete({ id: `m-${index}`, at: sameMinute, visibleFrom: 0 }));
    complete({ id: 'after-crowd', at: sameMinute + 5 * MINUTE, visibleFrom: 0 });
    vendor.requestCostMs = 1_000;
    vendor.cursorTtlMs = 60_000;
    const fired: string[] = [];
    for (let poll = 0; poll < 40 && !fired.includes('after-crowd'); poll++) {
      fired.push(...ids(await trigger.run(ctx({ store }))));
      advance();
    }
    expect(fired).toContain('after-crowd');
    expect(new Set(fired).size).toBe(fired.length);
    expect(warn.mock.calls.some(([message]) => String(message).includes('page cursors keep expiring'))).toBe(true);
  });

  it('caps the stored state below the store limit and never re-fires what it had to forget', async () => {
    const recent = Array.from({ length: 9000 }, (_, index) => ({ id: `6XGgm${String(index).padStart(11, '0')}`, at: now() - 10 * MINUTE + index * 50 }));
    recent.forEach(({ id, at }) => complete({ id, at, visibleFrom: 0 }));
    const seen = recent.map(({ id, at }) => `${id}|${iso(at)}`);
    const store = memoryStore({ taskCompletedState: { cursor: now() - MINUTE, seen, floor: 0, projectId: null } });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await trigger.run(ctx({ store }))).toEqual([]);
    const state = await store.get('taskCompletedState');
    expect(Buffer.byteLength(JSON.stringify(state))).toBeLessThanOrEqual(256 * 1024);
    expect(warn).toHaveBeenCalled();
    advance(1);
    expect(await trigger.run(ctx({ store }))).toEqual([]);
    complete({ id: 'fresh' });
    advance(1);
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['fresh']);
  });

  it('test() returns the newest completions when nothing was completed in the last hour', async () => {
    complete({ id: 'last-week', at: now() - 6 * DAY });
    complete({ id: 'three-days-ago', at: now() - 3 * DAY });
    complete({ id: 'two-days-ago', at: now() - 2 * DAY });
    const sample = await trigger.test(ctx({ store: memoryStore() }));
    expect(ids(sample)).toEqual(['last-week', 'three-days-ago', 'two-days-ago']);
  });

  it('test() still finds a completion from two months ago and returns at most five items', async () => {
    complete({ id: 'two-months-ago', at: now() - 60 * DAY });
    expect(ids(await trigger.test(ctx({ store: memoryStore() })))).toEqual(['two-months-ago']);
    Array.from({ length: 8 }, (_, index) => complete({ id: `today-${index}`, at: now() - (index + 1) * MINUTE }));
    expect(ids(await trigger.test(ctx({ store: memoryStore() })))).toEqual(['today-4', 'today-3', 'today-2', 'today-1', 'today-0']);
  });

  it('test() returns an empty list for an account with no completions', async () => {
    expect(await trigger.test(ctx({ store: memoryStore() }))).toEqual([]);
  });

  it('passes the project filter to Todoist', async () => {
    await trigger.test(ctx({ store: memoryStore(), projectId: '6XGgm6PHrGgMpCFX' }));
    expect(vendor.requests[0].project_id).toBe('6XGgm6PHrGgMpCFX');
  });

  it('every sampleData key exists in a real run item, and run and test emit the same shape', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    advance();
    complete({ id: 'real' });
    const [real] = await trigger.run(ctx({ store }));
    const [sample] = await trigger.test(ctx({ store: memoryStore() }));
    expect(keysOf(trigger.sampleData).length).toBeGreaterThan(0);
    for (const key of keysOf(trigger.sampleData)) {
      expect(real).toHaveProperty(key);
    }
    expect(keysOf(sample).sort()).toEqual(keysOf(real).sort());
  });

  it('does not shrink the chunk when the deadline stops a poll before its next request', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 10 * DAY, seen: [], floor: 0, projectId: null, chunkMs: DAY } });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vendor.requestCostMs = 13_000;
    await trigger.run(ctx({ store }));
    expect(vendor.requests).toHaveLength(2);
    expect(todoistFake.stateField({ store, key: 'chunkMs' })).toBe(4 * DAY);
  });

  it('replays a saved page cursor with the same since and until it was issued for', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() + 15 * MINUTE - 30_000, seen: [], floor: 0, projectId: null, chunkMs: 60_000 } });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const crowd = Array.from({ length: 6000 }, (_, index) => `head-${index}`);
    crowd.forEach((id) => complete({ id, at: now() - 10_000, visibleFrom: 0 }));
    vendor.requestCostMs = 1_000;
    const fired = ids(await trigger.run(ctx({ store })));
    const [first] = vendor.requests;
    expect(Date.parse(first.until) - Date.parse(first.since)).toBeLessThan(MINUTE);
    expect(todoistFake.field({ value: todoistFake.stateField({ store, key: 'resume' }), key: 'cursor' })).toBeTruthy();
    vendor.requests.length = 0;
    advance();
    fired.push(...ids(await trigger.run(ctx({ store }))));
    const replayed = vendor.requests.find((request) => request.cursor !== undefined);
    expect(replayed?.since).toBe(first.since);
    expect(replayed?.until).toBe(first.until);
    for (let poll = 0; poll < 5 && fired.length < crowd.length; poll++) {
      advance();
      fired.push(...ids(await trigger.run(ctx({ store }))));
    }
    expect(fired).toHaveLength(crowd.length);
    expect(new Set(fired)).toEqual(new Set(crowd));
  });
});

function keysOf(value: unknown): string[] {
  return typeof value === 'object' && value !== null ? Object.keys(value) : [];
}
