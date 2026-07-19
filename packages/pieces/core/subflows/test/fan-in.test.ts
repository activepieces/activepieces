/// <reference types="vitest/globals" />

import { evaluateFanIn, FanInState } from '../src/lib/fan-in';

const state = (overrides: Partial<FanInState> = {}): FanInState => ({
  batchesDispatched: 3,
  baselineSucceeded: 0,
  baselineFailed: 0,
  deadline: 10_000,
  ...overrides,
});

describe('evaluateFanIn', () => {
  test('all dispatched terminal and none in-flight → done', () => {
    const r = evaluateFanIn({
      cur: { succeeded: 2, failed: 1, nonTerminal: 0 },
      state: state(),
      nowMs: 5_000,
    });
    expect(r).toEqual({ done: true, timedOut: false, succeeded: 2, failed: 1, stillRunning: 0 });
  });

  test('fewer terminal than dispatched, even with nonTerminal 0 → not done (async-recording lag)', () => {
    const r = evaluateFanIn({
      cur: { succeeded: 1, failed: 0, nonTerminal: 0 },
      state: state(),
      nowMs: 5_000,
    });
    expect(r.done).toBe(false);
    expect(r.timedOut).toBe(false);
  });

  test('a child still running → not done', () => {
    const r = evaluateFanIn({
      cur: { succeeded: 2, failed: 0, nonTerminal: 1 },
      state: state(),
      nowMs: 5_000,
    });
    expect(r.done).toBe(false);
  });

  test('not done and past the deadline → timedOut with stillRunning', () => {
    const r = evaluateFanIn({
      cur: { succeeded: 1, failed: 0, nonTerminal: 1 },
      state: state(),
      nowMs: 20_000,
    });
    expect(r).toEqual({ done: false, timedOut: true, succeeded: 1, failed: 0, stillRunning: 2 });
  });

  test('empty CSV (batchesDispatched 0) → done immediately', () => {
    const r = evaluateFanIn({
      cur: { succeeded: 0, failed: 0, nonTerminal: 0 },
      state: state({ batchesDispatched: 0 }),
      nowMs: 5_000,
    });
    expect(r.done).toBe(true);
    expect(r.timedOut).toBe(false);
  });

  test('baseline terminal children are excluded from the delta', () => {
    const r = evaluateFanIn({
      cur: { succeeded: 12, failed: 3, nonTerminal: 0 },
      state: state({ batchesDispatched: 3, baselineSucceeded: 10, baselineFailed: 2 }),
      nowMs: 5_000,
    });
    expect(r).toEqual({ done: true, timedOut: false, succeeded: 2, failed: 1, stillRunning: 0 });
  });
});
