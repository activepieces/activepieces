import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { vapi } from '../src/index';
import { callEnded, callEndedInternals } from '../src/lib/triggers/call-ended';

const { selectNewCalls, LOOKBACK_MS } = callEndedInternals;
const T0 = Date.parse('2026-11-17T10:00:00.000Z');

function makeStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function invoke({ fn, context }: { fn: unknown; context: unknown }): Promise<unknown> {
  if (typeof fn !== 'function') throw new Error('not a function');
  return Promise.resolve(Reflect.apply(fn, callEnded, [context]));
}

function call({ id, status, endedAtMs }: { id: string; status: string; endedAtMs?: number }) {
  return {
    id,
    status,
    endedAt: endedAtMs === undefined ? undefined : new Date(endedAtMs).toISOString(),
    updatedAt: new Date((endedAtMs ?? T0) + 1000).toISOString(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('selectNewCalls', () => {
  it('emits only ended calls after enable, oldest first, and never twice', () => {
    const state = { enabledAt: T0, lastPollAt: T0, emitted: [] };
    const first = selectNewCalls({
      calls: [
        call({ id: 'late', status: 'ended', endedAtMs: T0 + 2000 }),
        call({ id: 'early', status: 'ended', endedAtMs: T0 + 1000 }),
        call({ id: 'live', status: 'in-progress' }),
        call({ id: 'before-enable', status: 'ended', endedAtMs: T0 - 1000 }),
      ],
      state,
      pollStartedAt: T0 + 60_000,
    });
    expect(first.emit.map((c) => c['id'])).toEqual(['early', 'late']);
    const second = selectNewCalls({
      calls: [
        call({ id: 'early', status: 'ended', endedAtMs: T0 + 1000 }),
        call({ id: 'late', status: 'ended', endedAtMs: T0 + 2000 }),
        call({ id: 'live', status: 'ended', endedAtMs: T0 + 1500 }),
      ],
      state: first.nextState,
      pollStartedAt: T0 + 120_000,
    });
    expect(second.emit.map((c) => c['id'])).toEqual(['live']);
  });

  it('prunes dedupe state outside the lookback window', () => {
    const result = selectNewCalls({
      calls: [],
      state: { enabledAt: 0, lastPollAt: T0, emitted: [{ id: 'old', endedAt: T0 - 2 * LOOKBACK_MS }, { id: 'new', endedAt: T0 }] },
      pollStartedAt: T0 + 1000,
    });
    expect(result.nextState.emitted).toEqual([{ id: 'new', endedAt: T0 }]);
  });
});

describe('call_ended trigger', () => {
  it('outputSchema covers every sampleData key', () => {
    const trigger = vapi.triggers()['call_ended'];
    const keys = trigger.outputSchema?.fields.map((field) => field.key) ?? [];
    for (const key of Object.keys(trigger.sampleData ?? {})) {
      expect(keys, key).toContain(key);
    }
  });

  it('polls with updatedAtGe = last poll minus lookback, emits once, and keeps state on failure', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    const store = makeStore();
    const context = { auth: { secret_text: 'k' }, propsValue: {}, store, files: {}, server: {}, setSchedule: () => undefined };
    await invoke({ fn: callEnded.onEnable, context });
    vi.setSystemTime(T0 + 60_000);
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue({ status: 200, headers: {}, body: [call({ id: 'c1', status: 'ended', endedAtMs: T0 + 30_000 })] });
    spy.mockResolvedValue({
      status: 200,
      headers: {},
      body: [{ ...call({ id: 'c1', status: 'ended', endedAtMs: T0 + 30_000 }), artifact: { presignedMonoUrl: 'x', recordingUrl: 'r' } }],
    });
    const out = await invoke({ fn: callEnded.run, context });
    expect(out).toHaveLength(1);
    expect(Array.isArray(out) ? out[0]['artifact'] : null).toEqual({ recordingUrl: 'r' });
    expect(spy.mock.calls[0][0].queryParams).toEqual({
      updatedAtGe: new Date(T0 - LOOKBACK_MS).toISOString(),
      updatedAtLe: new Date(T0 + 60_000).toISOString(),
      limit: '1000',
    });
    const again = await invoke({ fn: callEnded.run, context });
    expect(again).toEqual([]);
    const before = store.data.get('vapi_call_ended_state');
    spy.mockRejectedValue(new Error('down'));
    await expect(invoke({ fn: callEnded.run, context })).rejects.toThrow();
    expect(store.data.get('vapi_call_ended_state')).toEqual(before);
  });

  it('splits a full window in halves regardless of sort order and keeps every call', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => call({ id: `a${i}`, status: 'ended', endedAtMs: T0 + i }));
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: full })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: [call({ id: 'late', status: 'ended', endedAtMs: T0 + 900 })] })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: [call({ id: 'early', status: 'ended', endedAtMs: T0 + 10 })] });
    const calls = await callEndedInternals.fetchCallsUpdatedSince({ apiKey: 'k', since: T0, until: T0 + 1000 });
    expect(calls.map((c) => c['id']).sort()).toEqual(['early', 'late']);
    expect(spy.mock.calls[1][0].queryParams).toMatchObject({
      updatedAtGe: new Date(T0 + 501).toISOString(),
      updatedAtLe: new Date(T0 + 1000).toISOString(),
    });
    expect(spy.mock.calls[2][0].queryParams).toMatchObject({
      updatedAtGe: new Date(T0).toISOString(),
      updatedAtLe: new Date(T0 + 500).toISOString(),
    });
  });

  it('throws instead of skipping when windows stay full', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => call({ id: `a${i}`, status: 'ended', endedAtMs: T0 }));
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: full });
    await expect(callEndedInternals.fetchCallsUpdatedSince({ apiKey: 'k', since: T0, until: T0 + 1 })).rejects.toThrow(
      'no ended call is skipped'
    );
  });
});
