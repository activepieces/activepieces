import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AUTH, fake } from './fake-api';

vi.mock('@actual-app/api', async () => (await import('./fake-api')).fake);

import {
  pollNewTransactions,
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
