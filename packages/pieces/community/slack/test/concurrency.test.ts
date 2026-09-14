import { describe, expect, it, vi } from 'vitest';
import {
  slackConcurrency,
  DEFAULT_ACTION_CONCURRENCY_LIMIT,
  MAX_ACTION_CONCURRENCY_LIMIT,
  MIN_ACTION_CONCURRENCY_LIMIT,
} from '../src/lib/common/concurrency';

const { mapWithConcurrency, clampConcurrencyLimit } = slackConcurrency;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function tracker() {
  const state = { inFlight: 0, maxInFlight: 0, startOrder: [] as number[] };
  return {
    state,
    enter(index: number) {
      state.startOrder.push(index);
      state.inFlight += 1;
      state.maxInFlight = Math.max(state.maxInFlight, state.inFlight);
    },
    leave() {
      state.inFlight -= 1;
    },
  };
}

describe('mapWithConcurrency — degenerate inputs', () => {
  it('resolves immediately on an empty list and never calls the handler', async () => {
    let calls = 0;

    const results = await mapWithConcurrency({
      items: [],
      limit: 5,
      handler: async () => {
        calls += 1;
        return 'x';
      },
    });

    expect(results).toEqual([]);
    expect(calls).toBe(0);
  });

  it('runs strictly sequentially at limit 1', async () => {
    const { state, enter, leave } = tracker();

    await mapWithConcurrency({
      items: [0, 1, 2, 3],
      limit: 1,
      handler: async ({ index }) => {
        enter(index);
        await Promise.resolve();
        leave();
        return index;
      },
    });

    expect(state.maxInFlight).toBe(1);
    expect(state.startOrder).toEqual([0, 1, 2, 3]);
  });

  it('does not over-spawn when the limit exceeds the item count', async () => {
    const { state, enter, leave } = tracker();

    await mapWithConcurrency({
      items: [0, 1],
      limit: 20,
      handler: async ({ index }) => {
        enter(index);
        await Promise.resolve();
        leave();
        return index;
      },
    });

    expect(state.maxInFlight).toBeLessThanOrEqual(2);
  });

  it('starts every item when the limit equals the item count', async () => {
    const gates = [deferred<void>(), deferred<void>(), deferred<void>()];
    const { state, enter, leave } = tracker();

    const run = mapWithConcurrency({
      items: [0, 1, 2],
      limit: 3,
      handler: async ({ index }) => {
        enter(index);
        await gates[index].promise;
        leave();
        return index;
      },
    });

    await Promise.resolve();
    expect(state.maxInFlight).toBe(3);

    gates.forEach((gate) => gate.resolve());
    await expect(run).resolves.toEqual([0, 1, 2]);
  });
});

describe('mapWithConcurrency — the limit is real', () => {
  it('never exceeds the limit in flight', async () => {
    const { state, enter, leave } = tracker();

    await mapWithConcurrency({
      items: Array.from({ length: 40 }, (_unused, index) => index),
      limit: DEFAULT_ACTION_CONCURRENCY_LIMIT,
      handler: async ({ index }) => {
        enter(index);
        await new Promise((resolve) => setTimeout(resolve, 1));
        leave();
        return index;
      },
    });

    expect(state.maxInFlight).toBe(DEFAULT_ACTION_CONCURRENCY_LIMIT);
  });

  it('never exceeds the maximum limit in flight', async () => {
    const { state, enter, leave } = tracker();

    await mapWithConcurrency({
      items: Array.from({ length: 60 }, (_unused, index) => index),
      limit: MAX_ACTION_CONCURRENCY_LIMIT,
      handler: async ({ index }) => {
        enter(index);
        await new Promise((resolve) => setTimeout(resolve, 1));
        leave();
        return index;
      },
    });

    expect(state.maxInFlight).toBe(MAX_ACTION_CONCURRENCY_LIMIT);
  });

  it('replaces completed work instead of waiting for a whole batch', async () => {
    const gates = Array.from({ length: 6 }, () => deferred<void>());
    const { state, enter, leave } = tracker();

    const run = mapWithConcurrency({
      items: Array.from({ length: 6 }, (_unused, index) => index),
      limit: 3,
      handler: async ({ index }) => {
        enter(index);
        await gates[index].promise;
        leave();
        return index;
      },
    });

    await Promise.resolve();
    expect(state.startOrder).toEqual([0, 1, 2]);

    gates[1].resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(state.startOrder).toEqual([0, 1, 2, 3]);
    expect(state.maxInFlight).toBe(3);

    gates.forEach((gate) => gate.resolve());
    await run;
  });

  it('keeps results index-aligned when completion order is reversed', async () => {
    const results = await mapWithConcurrency({
      items: ['a', 'b', 'c', 'd'],
      limit: 4,
      handler: async ({ item, index }) => {
        await new Promise((resolve) => setTimeout(resolve, (4 - index) * 3));
        return item.toUpperCase();
      },
    });

    expect(results).toEqual(['A', 'B', 'C', 'D']);
  });

  it('a throwing handler rejects the run, so callers must catch per item', async () => {
    await expect(
      mapWithConcurrency({
        items: [0, 1, 2],
        limit: 2,
        handler: async ({ index }) => {
          if (index === 1) {
            throw new Error('boom');
          }
          return index;
        },
      }),
    ).rejects.toThrow('boom');
  });

  it('survives a failing item when the handler catches its own error', async () => {
    const results = await mapWithConcurrency({
      items: [0, 1, 2],
      limit: 2,
      handler: async ({ index }) => {
        try {
          if (index === 1) {
            throw new Error('boom');
          }
          return { ok: true as const, index };
        } catch {
          return { ok: false as const, index };
        }
      },
    });

    expect(results).toEqual([
      { ok: true, index: 0 },
      { ok: false, index: 1 },
      { ok: true, index: 2 },
    ]);
  });
});

describe('clampConcurrencyLimit', () => {
  it('defaults when the prop is absent', () => {
    expect(clampConcurrencyLimit(undefined)).toBe(DEFAULT_ACTION_CONCURRENCY_LIMIT);
    expect(clampConcurrencyLimit(null)).toBe(DEFAULT_ACTION_CONCURRENCY_LIMIT);
    expect(clampConcurrencyLimit('')).toBe(DEFAULT_ACTION_CONCURRENCY_LIMIT);
  });

  it('clamps above the maximum', () => {
    expect(clampConcurrencyLimit(21)).toBe(MAX_ACTION_CONCURRENCY_LIMIT);
    expect(clampConcurrencyLimit(500)).toBe(MAX_ACTION_CONCURRENCY_LIMIT);
  });

  it('clamps at or below zero to the minimum', () => {
    expect(clampConcurrencyLimit(0)).toBe(MIN_ACTION_CONCURRENCY_LIMIT);
    expect(clampConcurrencyLimit(-4)).toBe(MIN_ACTION_CONCURRENCY_LIMIT);
  });

  it('floors a float', () => {
    expect(clampConcurrencyLimit(7.9)).toBe(7);
  });

  it('accepts a numeric string, since dynamic values arrive as text', () => {
    expect(clampConcurrencyLimit('8')).toBe(8);
    expect(clampConcurrencyLimit('99')).toBe(MAX_ACTION_CONCURRENCY_LIMIT);
  });

  it('rejects a non-numeric value rather than silently clamping it', () => {
    expect(() => clampConcurrencyLimit('lots')).toThrow();
    expect(() => clampConcurrencyLimit({})).toThrow();
    expect(() => clampConcurrencyLimit(Number.NaN)).toThrow();
  });

  it('passes valid in-range values through', () => {
    expect(clampConcurrencyLimit(1)).toBe(1);
    expect(clampConcurrencyLimit(5)).toBe(5);
    expect(clampConcurrencyLimit(20)).toBe(20);
  });
});

describe('mapWithConcurrency — the send deadline', () => {
  it('runs every item when the deadline is never reached', async () => {
    const handled: number[] = [];

    const results = await mapWithConcurrency({
      items: [1, 2, 3, 4],
      limit: 2,
      handler: async ({ item }) => {
        handled.push(item);
        return `sent-${item}`;
      },
      deadline: { at: Date.now() + 60_000, onExceeded: () => 'skipped' },
    });

    expect(handled).toHaveLength(4);
    expect(results).toEqual(['sent-1', 'sent-2', 'sent-3', 'sent-4']);
  });

  it('issues no request at all when the deadline has already passed', async () => {
    const handled: number[] = [];

    const results = await mapWithConcurrency({
      items: [1, 2, 3],
      limit: 2,
      handler: async ({ item }) => {
        handled.push(item);
        return `sent-${item}`;
      },
      deadline: { at: Date.now() - 1, onExceeded: () => 'skipped' },
    });

    expect(handled).toEqual([]);
    expect(results).toEqual(['skipped', 'skipped', 'skipped']);
  });

  it('keeps what it already did and stops starting more once the deadline passes', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    let clock = 0;
    nowSpy.mockImplementation(() => clock);

    const handled: number[] = [];

    const results = await mapWithConcurrency({
      items: [1, 2, 3, 4, 5, 6],
      limit: 1,
      handler: async ({ item }) => {
        handled.push(item);
        clock += 100;
        return `sent-${item}`;
      },
      deadline: { at: 250, onExceeded: ({ item }) => `skipped-${item}` },
    });

    nowSpy.mockRestore();

    expect(handled).toEqual([1, 2, 3]);
    expect(results).toEqual(['sent-1', 'sent-2', 'sent-3', 'skipped-4', 'skipped-5', 'skipped-6']);
  });

  it('reports every item in order, whether it ran or was skipped', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    let clock = 0;
    nowSpy.mockImplementation(() => clock);

    const results = await mapWithConcurrency({
      items: ['a', 'b', 'c', 'd'],
      limit: 2,
      handler: async ({ item, index }) => {
        clock += 500;
        return { item, index, ran: true };
      },
      deadline: { at: 600, onExceeded: ({ item, index }) => ({ item, index, ran: false }) },
    });

    expect(results.map((result) => result.index)).toEqual([0, 1, 2, 3]);
    expect(results.filter((result) => result.ran).length).toBeGreaterThan(0);
    expect(results.filter((result) => !result.ran).length).toBeGreaterThan(0);

    nowSpy.mockRestore();
  });
});
