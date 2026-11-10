import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { todoistFake } from './todoist-fake';

const { MINUTE, DAY, vendor, trigger, setClock, advance, now, iso, complete, memoryStore, ctx, ids } = todoistFake;

beforeEach(() => {
  todoistFake.reset();
});

afterEach(() => {
  todoistFake.restore();
});

describe('Todoist Task Completed QA edge cases', () => {
  it('does not fire a completion twice when it sits on the second the since parameter is floored to', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    complete({ id: 'edge', at: Date.UTC(2026, 10, 1, 10, 0, 30, 0) });
    const fired: string[] = [];
    for (const minute of [5, 10, 15, 20, 25, 30, 35, 40, 45]) {
      setClock(Date.UTC(2026, 10, 1, 10, minute, 30, 700));
      fired.push(...ids(await trigger.run(ctx({ store }))));
    }
    expect(fired).toEqual(['edge']);
  });

  it('keeps the seen set bounded by the overlap window over many polls', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    let next = 0;
    let fired = 0;
    for (let poll = 0; poll < 100; poll++) {
      advance(1);
      for (let k = 0; k < 10; k++) {
        complete({ id: `t${next++}`, at: now() - k * 1000 });
      }
      advance(5);
      fired += (await trigger.run(ctx({ store }))).length;
    }
    const seen = (await store.get<{ seen: string[] }>('taskCompletedState'))?.seen ?? [];
    expect(fired).toBe(1000);
    expect(seen.length).toBeLessThanOrEqual(70);
  });

  it('fires a completion made between the last poll and a republish', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    advance();
    expect(await trigger.run(ctx({ store }))).toEqual([]);
    advance(2);
    complete({ id: 'gap' });
    await trigger.onDisable(ctx({ store, isRepublish: true }));
    await trigger.onEnable(ctx({ store, isRepublish: true }));
    advance(3);
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['gap']);
  });

  it('test() sorts oldest to newest, newest last, whatever order Todoist returns', async () => {
    vendor.rawItems = [
      { id: 'a', completed_at: iso(now() - 3 * MINUTE) },
      { id: 'b', completed_at: iso(now() - 2 * MINUTE) },
      { id: 'c', completed_at: iso(now() - MINUTE) },
    ];
    expect(ids(await trigger.test(ctx({ store: memoryStore() })))).toEqual(['a', 'b', 'c']);
  });

  it('a failure on a later page throws and leaves the stored cursor and seen set untouched', async () => {
    const store = memoryStore({ lastPoll: now() - 5 * MINUTE });
    vendor.rawItems = [{ id: 'p1', completed_at: iso(now() - MINUTE) }];
    vendor.rawNextCursor = 'a.b';
    vendor.failOnCall = 2;
    await expect(trigger.run(ctx({ store }))).rejects.toThrow('Todoist failure on call 2');
    expect(await store.get('lastPoll')).toBe(now() - 5 * MINUTE);
    expect(await store.get('taskCompletedState')).toBeNull();
    expect(store.puts).toEqual([]);
  });

  it('skips items with a missing or unparseable completed_at without dropping the batch', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    advance();
    vendor.rawItems = [
      { id: 'bad', completed_at: 'not-a-date' },
      { id: 'missing', completed_at: null },
      { id: 'good', completed_at: iso(now() - 1000) },
    ];
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['good']);
  });

  it('upgrading a store whose lastPoll is the old enable time fires only later completions, once', async () => {
    const store = memoryStore({ lastPoll: now() - 2 * MINUTE });
    complete({ id: 'before-enable', at: now() - 10 * MINUTE });
    complete({ id: 'after', at: now() - MINUTE });
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['after']);
    advance();
    expect(await trigger.run(ctx({ store }))).toEqual([]);
    advance(20);
    expect(await trigger.run(ctx({ store }))).toEqual([]);
  });

  it('fires a completion at the poll instant once (until is exclusive and one second past now)', async () => {
    const store = memoryStore();
    await trigger.onEnable(ctx({ store }));
    advance();
    setClock(now() + 400);
    complete({ id: 'at-now', at: now() });
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['at-now']);
    advance();
    expect(await trigger.run(ctx({ store }))).toEqual([]);
  });

  it('makes progress across polls when one week holds more pages than a poll can fetch before its deadline', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 20 * DAY, seen: [], projectId: null } });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const week = Array.from({ length: 6000 }, (_, index) => `w-${index}`);
    week.forEach((id, index) => complete({ id, at: now() - 20 * DAY + (index + 1) * MINUTE, visibleFrom: 0 }));
    vendor.requestCostMs = 1_000;
    const fired: string[] = [];
    for (let poll = 0; poll < 10; poll++) {
      fired.push(...ids(await trigger.run(ctx({ store }))));
      advance();
    }
    expect(fired.length).toBeGreaterThan(0);
    expect(new Set(fired).size).toBe(fired.length);
  });

  it('drains a dense week even when Todoist page cursors expire before the next poll', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 20 * DAY, seen: [], projectId: null } });
    const week = Array.from({ length: 1200 }, (_, index) => `w-${index}`);
    week.forEach((id, index) => complete({ id, at: now() - 20 * DAY + (index + 1) * 5 * MINUTE, visibleFrom: 0 }));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vendor.cursorTtlMs = 60_000;
    vendor.requestCostMs = 9_000;
    const fired: string[] = [];
    for (let poll = 0; poll < 30; poll++) {
      fired.push(...ids(await trigger.run(ctx({ store }))));
      advance();
    }
    expect(new Set(fired).size).toBe(fired.length);
    expect(new Set(fired)).toEqual(new Set(week));
  });

  it('keeps the stored state under the 512 KB store limit while resuming a very dense week', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 20 * DAY, seen: [], projectId: null } });
    const week = Array.from({ length: 14000 }, (_, index) => `6XGgm${String(index).padStart(11, '0')}`);
    week.forEach((id, index) => complete({ id, at: now() - 20 * DAY + Math.floor(((index + 1) * 7 * DAY) / 14002), visibleFrom: 0 }));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vendor.requestCostMs = 9_000;
    let largest = 0;
    for (let poll = 0; poll < 30; poll++) {
      await trigger.run(ctx({ store }));
      largest = Math.max(largest, Buffer.byteLength(JSON.stringify(await store.get('taskCompletedState'))));
      advance();
    }
    expect(largest).toBeLessThanOrEqual(512 * 1024);
  }, 60_000);
});
