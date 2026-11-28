import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { todoistFake } from './todoist-fake';

const { MINUTE, DAY, vendor, trigger, advance, now, complete, memoryStore, ctx, ids } = todoistFake;

function savedCursor(store: ReturnType<typeof memoryStore>): number {
  return Number(todoistFake.stateField({ store, key: 'cursor' }));
}

beforeEach(() => {
  todoistFake.reset();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  todoistFake.restore();
});

describe('Todoist Task Completed overlap after a deadline-stopped poll', () => {
  it('emits a completion listed late just before the stop point exactly once', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 2 * DAY, seen: [], floor: 0, projectId: null, chunkMs: 60_000 } });
    vendor.requestCostMs = 12_000;
    await trigger.run(ctx({ store }));
    const stoppedAt = savedCursor(store);
    expect(stoppedAt).toBeLessThan(now() - DAY);
    complete({ id: 'late', at: stoppedAt - MINUTE });
    const fired: string[] = [];
    for (let poll = 0; poll < 3; poll++) {
      advance();
      fired.push(...ids(await trigger.run(ctx({ store }))));
    }
    expect(fired.filter((id) => id === 'late')).toEqual(['late']);
  });

  it('continues a saved page cursor on the next poll', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 2 * DAY, seen: [], floor: 0, projectId: null, chunkMs: 60_000 } });
    const crowd = Array.from({ length: 3000 }, (_, index) => `c-${index}`);
    crowd.forEach((id) => complete({ id, at: now() - 2 * DAY + 30_000, visibleFrom: 0 }));
    vendor.requestCostMs = 1_000;
    const fired: string[] = [];
    let resumed = false;
    for (let poll = 0; poll < 10 && fired.length < crowd.length; poll++) {
      vendor.requests.length = 0;
      fired.push(...ids(await trigger.run(ctx({ store }))));
      resumed ||= vendor.requests.some((request) => request.cursor !== undefined);
      advance();
    }
    expect(resumed).toBe(true);
    expect(fired).toHaveLength(crowd.length);
    expect(new Set(fired)).toEqual(new Set(crowd));
  });

  it('never moves the cursor back across repeated deadline-stopped polls and catches up', async () => {
    const store = memoryStore({ taskCompletedState: { cursor: now() - 3 * DAY, seen: [], floor: 0, projectId: null, chunkMs: 60_000 } });
    complete({ id: 'recent', at: now() - MINUTE, visibleFrom: 0 });
    vendor.requestCostMs = 12_000;
    let previous = savedCursor(store);
    const fired: string[] = [];
    for (let poll = 0; poll < 40 && !fired.includes('recent'); poll++) {
      fired.push(...ids(await trigger.run(ctx({ store }))));
      const cursor = savedCursor(store);
      expect(cursor).toBeGreaterThanOrEqual(previous);
      previous = cursor;
      advance();
    }
    expect(fired).toEqual(['recent']);
  });
});
