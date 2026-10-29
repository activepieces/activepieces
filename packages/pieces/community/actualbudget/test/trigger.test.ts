import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AUTH, fake } from './fake-api';

vi.mock('@actual-app/api', async () => (await import('./fake-api')).fake);

import { Store } from '@activepieces/pieces-framework';
import {
  SEEN_CHUNK_SIZE,
  loadSeenIds,
  newTransaction,
  pollNewTransactions,
  saveSeenIds,
} from '../src/lib/triggers/new-transaction';

const NOW = new Date('2026-10-26T12:00:00Z');

beforeEach(() => {
  vi.clearAllMocks();
  fake.state.accounts = [{ id: 'a1', name: 'Checking' }];
  fake.state.payees = [];
  fake.state.categories = [];
  fake.state.transactions = [
    { id: 'old', account: 'a1', date: '2026-10-25', amount: -100 },
  ];
});

describe('new transaction polling', () => {
  test('first run baselines without emitting; a new transaction then fires exactly once', async () => {
    const first = await pollNewTransactions({
      auth: AUTH,
      accountId: undefined,
      seen: null,
      now: NOW,
    });
    expect(first.emit).toEqual([]);
    expect(first.seen).toEqual(['old']);

    fake.state.transactions.push({
      id: 'new',
      account: 'a1',
      date: '2026-10-26',
      amount: -500,
    });
    const second = await pollNewTransactions({
      auth: AUTH,
      accountId: undefined,
      seen: first.seen,
      now: NOW,
    });
    expect(second.emit.map((t) => t.id)).toEqual(['new']);
    expect(second.emit[0]).toMatchObject({
      amount_decimal: -5,
      account_name: 'Checking',
    });

    const third = await pollNewTransactions({
      auth: AUTH,
      accountId: undefined,
      seen: second.seen,
      now: NOW,
    });
    expect(third.emit).toEqual([]);
  });

  test('reads a 7-day window and filters by account when set', async () => {
    await pollNewTransactions({
      auth: AUTH,
      accountId: 'a1',
      seen: [],
      now: NOW,
    });
    expect(fake.state.queries.at(-1)?.filter).toEqual({
      date: { $gte: '2026-10-19' },
      account: 'a1',
    });
  });

  test('large windows keep every ID so nothing fires twice', async () => {
    fake.state.transactions = Array.from({ length: 5010 }, (_, i) => ({
      id: `t${i}`,
      account: 'a1',
      date: '2026-10-25',
      amount: 1,
    }));
    const baseline = await pollNewTransactions({
      auth: AUTH,
      accountId: undefined,
      seen: null,
      now: NOW,
    });
    expect(baseline.seen).toHaveLength(5010);
    const next = await pollNewTransactions({
      auth: AUTH,
      accountId: undefined,
      seen: baseline.seen,
      now: NOW,
    });
    expect(next.emit).toEqual([]);
  });

  test('IDs that leave the window are dropped from the store', async () => {
    fake.state.transactions = [
      { id: 'recent', account: 'a1', date: '2026-10-25', amount: 1 },
    ];
    const out = await pollNewTransactions({
      auth: AUTH,
      accountId: undefined,
      seen: ['old', 'recent'],
      now: NOW,
    });
    expect(out.seen).toEqual(['recent']);
    expect(out.emit).toEqual([]);
  });
});

describe('seen ID storage', () => {
  test('large ID lists are split into entries under the 512 KiB store limit and read back whole', async () => {
    const { store, data } = memoryStore();
    const ids = Array.from({ length: 13444 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`
    );
    await saveSeenIds({ store, ids });
    const sizes = Object.values(data).map((value) => JSON.stringify(value).length);
    expect(Math.max(...sizes)).toBeLessThan(512 * 1024);
    expect(Object.keys(data)).toHaveLength(Math.ceil(13444 / SEEN_CHUNK_SIZE) + 1);
    expect(await loadSeenIds({ store })).toEqual(ids);
  });

  test('shrinking removes stale entries and disable clears everything', async () => {
    const { store, data } = memoryStore();
    await saveSeenIds({ store, ids: Array.from({ length: 12000 }, (_, i) => `t${i}`) });
    await saveSeenIds({ store, ids: ['t1'] });
    expect(Object.keys(data)).toHaveLength(2);
    expect(await loadSeenIds({ store })).toEqual(['t1']);
    await saveSeenIds({ store, ids: null });
    expect(data).toEqual({});
    expect(await loadSeenIds({ store })).toBeNull();
  });
});

describe('seen ID storage under failure', () => {
  test('a save that fails part-way keeps the previous checkpoint intact', async () => {
    const { store, data } = memoryStore();
    const before = Array.from({ length: 6000 }, (_, i) => `t${i}`);
    await saveSeenIds({ store, ids: before });
    const failing: Store = {
      ...store,
      async put<T>(key: string, value: T): Promise<T> {
        if (key.endsWith('_1')) throw new Error('store down');
        return store.put(key, value);
      },
    };
    await expect(
      saveSeenIds({ store: failing, ids: ['backdated', ...before] })
    ).rejects.toThrow('store down');
    expect(await loadSeenIds({ store })).toEqual(before);
    await saveSeenIds({ store, ids: ['backdated', ...before] });
    expect(await loadSeenIds({ store })).toEqual(['backdated', ...before]);
    expect(Object.keys(data)).toHaveLength(3);
  });
});

describe('seen ID cleanup', () => {
  test('a failed delete of the old chunks does not fail the save', async () => {
    const { store } = memoryStore();
    await saveSeenIds({ store, ids: ['t1'] });
    const failingDelete: Store = {
      ...store,
      async delete(): Promise<void> {
        throw new Error('store down');
      },
    };
    await saveSeenIds({ store: failingDelete, ids: ['t1', 't2'] });
    expect(await loadSeenIds({ store })).toEqual(['t1', 't2']);
    await saveSeenIds({ store, ids: ['t3'] });
    expect(await loadSeenIds({ store })).toEqual(['t3']);
  });
});

describe('trigger lifecycle', () => {
  test('republish keeps the checkpoint; a fresh enable re-baselines', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    const { store } = memoryStore();
    const enable = (isRepublish: boolean) =>
      newTransaction.onEnable({
        auth: { props: AUTH },
        propsValue: { account_id: undefined },
        store,
        isRepublish,
      } as unknown as Parameters<typeof newTransaction.onEnable>[0]);
    await enable(false);
    expect(await loadSeenIds({ store })).toEqual(['old']);
    fake.state.transactions.push({ id: 'b', account: 'a1', date: '2026-10-26', amount: -50 });
    await newTransaction.onDisable(
      { store } as unknown as Parameters<typeof newTransaction.onDisable>[0]
    );
    await enable(true);
    expect(await loadSeenIds({ store })).toEqual(['old']);
    await enable(false);
    expect((await loadSeenIds({ store }))?.sort()).toEqual(['b', 'old']);
    vi.useRealTimers();
  });
});

function memoryStore(): { store: Store; data: Record<string, unknown> } {
  const data: Record<string, unknown> = {};
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      data[key] = value;
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return key in data ? readValue<T>({ value: data[key] }) : null;
    },
    async delete(key: string): Promise<void> {
      delete data[key];
    },
  };
  return { store, data };
}

function readValue<T>({ value }: { value: unknown }): T {
  return JSON.parse(JSON.stringify(value));
}
