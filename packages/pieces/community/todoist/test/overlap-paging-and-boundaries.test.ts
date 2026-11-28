import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { todoistFake } from './todoist-fake';

const { MINUTE, DAY, vendor, trigger, advance, now, complete, memoryStore, ctx, ids } = todoistFake;

const WHOLE_SECOND_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

function utcParam(epochMs: number): string {
  return new Date(Math.floor(epochMs / 1000) * 1000).toISOString().replace('.000Z', 'Z');
}

function savedCursor(store: ReturnType<typeof memoryStore>): number {
  return Number(todoistFake.stateField({ store, key: 'cursor' }));
}

function requestMethods(): string[] {
  return vi.mocked(fetch).mock.calls.map(([input, init]) => init?.method ?? (input instanceof Request ? input.method : 'GET'));
}

beforeEach(() => {
  todoistFake.reset();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  todoistFake.restore();
});

describe('Todoist Task Completed overlap paging', () => {
  it('follows next_cursor through the overlap so a late completion behind 200 newer ones still fires', async () => {
    const cursor = now() - 2 * MINUTE;
    const store = memoryStore({ taskCompletedState: { cursor, seen: [], floor: 0, projectId: null, chunkMs: 60_000 } });
    const crowd = Array.from({ length: 300 }, (_, index) => `n-${index}`);
    crowd.forEach((id, index) => complete({ id, at: cursor - 10 * MINUTE + index * 100, visibleFrom: 0 }));
    complete({ id: 'late', at: cursor - 14 * MINUTE, visibleFrom: 0 });
    const fired = ids(await trigger.run(ctx({ store })));
    expect(fired).toContain('late');
    expect(new Set(fired)).toEqual(new Set([...crowd, 'late']));
    const overlapSince = utcParam(cursor - 15 * MINUTE);
    const overlapRequests = vendor.requests.filter((request) => request['since'] === overlapSince);
    expect(overlapRequests.length).toBeGreaterThanOrEqual(2);
    expect(overlapRequests.some((request) => request['cursor'] !== undefined)).toBe(true);
    expect(requestMethods().every((method) => method === 'GET')).toBe(true);
  });

  it('resumes a deadline-stopped overlap on the next poll, never moves the cursor back, and catches up', async () => {
    const cursor = now() - 2 * MINUTE;
    const store = memoryStore({ taskCompletedState: { cursor, seen: [], floor: 0, projectId: null, chunkMs: 60_000 } });
    const crowd = Array.from({ length: 1500 }, (_, index) => `o-${index}`);
    crowd.forEach((id, index) => complete({ id, at: cursor - 14 * MINUTE + index * 500, visibleFrom: 0 }));
    complete({ id: 'after', at: cursor + 30_000, visibleFrom: 0 });
    vendor.requestCostMs = 12_000;
    let previous = savedCursor(store);
    const fired: string[] = [];
    for (let poll = 0; poll < 20 && !fired.includes('after'); poll++) {
      fired.push(...ids(await trigger.run(ctx({ store }))));
      const saved = savedCursor(store);
      expect(saved).toBeGreaterThanOrEqual(previous);
      previous = saved;
      advance(1);
    }
    expect(fired).toContain('after');
    expect(new Set(fired)).toEqual(new Set([...crowd, 'after']));
    expect(fired).toHaveLength(crowd.length + 1);
  });
});

describe('Todoist Task Completed overlap after a finished poll', () => {
  it('re-reads the overlap in a quiet period so a completion listed late fires exactly once', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 30 * MINUTE, seen: [], floor: 0, projectId: null, chunkMs: 60_000 } });
    const firstAt = now() - MINUTE;
    complete({ id: 'first', at: firstAt, visibleFrom: 0 });
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['first']);
    const cursorAfterFirst = savedCursor(store);
    advance(1);
    expect(ids(await trigger.run(ctx({ store })))).toEqual([]);
    expect(savedCursor(store)).toBe(cursorAfterFirst);
    complete({ id: 'late', at: firstAt - 30_000 });
    advance(1);
    vendor.requests.length = 0;
    expect(ids(await trigger.run(ctx({ store })))).toEqual(['late']);
    expect(vendor.requests.some((request) => request['since'] === utcParam(cursorAfterFirst - 15 * MINUTE))).toBe(true);
    advance(1);
    expect(ids(await trigger.run(ctx({ store })))).toEqual([]);
    expect(requestMethods().every((method) => method === 'GET')).toBe(true);
  });
});

describe('Todoist Task Completed overlap marker', () => {
  it('lets a finished-overlap marker skip at most one poll', async () => {
    const cursor = Math.floor((now() - 20 * MINUTE) / 1000) * 1000;
    const since = cursor - 15 * MINUTE;
    const store = memoryStore({
      taskCompletedState: { cursor, seen: [], floor: 0, projectId: null, chunkMs: 60_000, resume: null, overlap: { since, until: cursor, cursor: null, restarts: 0 } },
    });
    complete({ id: 'late', at: cursor - 5 * MINUTE, visibleFrom: 0 });
    const fired: string[] = [];
    for (let poll = 0; poll < 2; poll++) {
      fired.push(...ids(await trigger.run(ctx({ store }))));
      advance(1);
    }
    expect(fired).toEqual(['late']);
    expect(todoistFake.stateField({ store, key: 'overlap' })).toBeNull();
  });
});

describe('Todoist Task Completed second boundaries', () => {
  it('fires a completion in the same second as a cursor with milliseconds exactly once', async () => {
    const second = Math.floor((now() - 5 * MINUTE) / 1000) * 1000;
    const store = memoryStore({ taskCompletedState: { cursor: second + 700, seen: [], floor: 0, projectId: null, chunkMs: 60_000 } });
    complete({ id: 'half-second', at: second + 500, visibleFrom: 0 });
    const fired = ids(await trigger.run(ctx({ store })));
    advance(1);
    fired.push(...ids(await trigger.run(ctx({ store }))));
    expect(fired).toEqual(['half-second']);
    expect(vendor.requests.every((request) => WHOLE_SECOND_UTC.test(request['since']) && WHOLE_SECOND_UTC.test(request['until']))).toBe(true);
    expect(requestMethods().every((method) => method === 'GET')).toBe(true);
  });

  it('fires a completion just before a millisecond cursor on a catch-up poll', async () => {
    const second = Math.floor((now() - 2 * DAY) / 1000) * 1000;
    const store = memoryStore({ taskCompletedState: { cursor: second + 700, seen: [], floor: 0, projectId: null, chunkMs: 60_000 } });
    complete({ id: 'boundary', at: second + 500, visibleFrom: 0 });
    vendor.requestCostMs = 1_000;
    const fired: string[] = [];
    for (let poll = 0; poll < 10; poll++) {
      fired.push(...ids(await trigger.run(ctx({ store }))));
      advance(1);
    }
    expect(fired).toEqual(['boundary']);
  });
});
