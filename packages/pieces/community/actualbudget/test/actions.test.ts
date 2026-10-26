import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fake, runAction } from './fake-api';

vi.mock('@actual-app/api', async () => (await import('./fake-api')).fake);

import { addTransaction } from '../src/lib/actions/ai/add-transaction';
import { importTransaction } from '../src/lib/actions/import-transaction';
import { importTransactions } from '../src/lib/actions/import-transactions';
import { deleteTransaction } from '../src/lib/actions/delete-transaction';
import { updateTransaction } from '../src/lib/actions/update-transaction';
import { setBudgetAmount } from '../src/lib/actions/set-budget-amount';
import { runBankSync } from '../src/lib/actions/run-bank-sync';
import { findTransactions } from '../src/lib/actions/find-transactions';
import { getBudgetMonth } from '../src/lib/actions/ai/get-budget-month';

const TX = {
  id: 't1',
  account: 'a1',
  date: '2026-10-20',
  amount: -1250,
  payee: 'p1',
  category: 'c1',
  notes: 'n',
  cleared: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  fake.state.accounts = [
    { id: 'a1', name: 'Checking', closed: false, account_sync_source: null },
  ];
  fake.state.categories = [{ id: 'c1', name: 'Food', group_id: 'g1' }];
  fake.state.payees = [{ id: 'p1', name: 'Kroger' }];
  fake.state.transactions = [{ ...TX }];
  fake.state.queries.length = 0;
});

describe('add transaction (ai)', () => {
  test('sends integer cents and the YYYY-MM-DD date to importTransactions', async () => {
    const out = await runAction({
      action: addTransaction,
      propsValue: {
        account_id: 'a1',
        date: '2026-10-21',
        amount: -12.5,
        payee_name: 'Kroger',
        category_id: 'c1',
        imported_id: 'k-1',
      },
    });
    expect(fake.importTransactions).toHaveBeenCalledWith('a1', [
      expect.objectContaining({
        date: '2026-10-21',
        amount: -1250,
        payee_name: 'Kroger',
        category: 'c1',
        imported_id: 'k-1',
      }),
    ]);
    expect(out).toMatchObject({
      transaction_id: 't-new',
      created: true,
      duplicate: false,
    });
  });

  test('a repeat with the same imported_id returns the existing transaction as duplicate', async () => {
    fake.importTransactions.mockResolvedValueOnce({
      added: [],
      updated: [],
      errors: [],
    });
    fake.state.transactions = [{ ...TX, imported_id: 'k-1' }];
    const out = await runAction({
      action: addTransaction,
      propsValue: {
        account_id: 'a1',
        date: '2026-10-20',
        amount: -12.5,
        imported_id: 'k-1',
      },
    });
    expect(out).toMatchObject({
      transaction_id: 't1',
      created: false,
      duplicate: true,
    });
  });

  test('importer errors fail the step', async () => {
    fake.importTransactions.mockResolvedValueOnce({
      added: [],
      updated: [],
      errors: [{ message: 'Amount is invalid' }],
    });
    await expect(
      runAction({
        action: addTransaction,
        propsValue: { account_id: 'a1', date: '2026-10-20', amount: 1 },
      })
    ).rejects.toThrow('Amount is invalid');
  });

  test('unknown account or category fails before importing', async () => {
    await expect(
      runAction({
        action: addTransaction,
        propsValue: { account_id: 'nope', date: '2026-10-20', amount: 1 },
      })
    ).rejects.toThrow('No account');
    await expect(
      runAction({
        action: addTransaction,
        propsValue: {
          account_id: 'a1',
          date: '2026-10-20',
          amount: 1,
          category_id: 'zz',
        },
      })
    ).rejects.toThrow('No category');
    expect(fake.importTransactions).not.toHaveBeenCalled();
  });

  test('bad date fails before opening the budget', async () => {
    await expect(
      runAction({
        action: addTransaction,
        propsValue: { account_id: 'a1', date: '20/10/2026', amount: 1 },
      })
    ).rejects.toThrow('YYYY-MM-DD');
    expect(fake.init).not.toHaveBeenCalled();
  });
});

describe('import transaction (human)', () => {
  test('uses the leading day of the ISO value and converts the decimal amount', async () => {
    await runAction({
      action: importTransaction,
      propsValue: {
        account_id: 'a1',
        date: '2026-10-20T00:00:00.000Z',
        amount: 3.2,
        cleared: false,
      },
    });
    expect(fake.importTransactions).toHaveBeenCalledWith('a1', [
      expect.objectContaining({
        date: '2026-10-20',
        amount: 320,
        cleared: false,
      }),
    ]);
  });
});

describe('import transactions (bulk)', () => {
  test('passes cents through untouched', async () => {
    await runAction({
      action: importTransactions,
      propsValue: {
        account_id: 'a1',
        transactions: [{ date: '2026-10-01', amount: -1250 }],
      },
    });
    expect(fake.importTransactions).toHaveBeenCalledWith('a1', [
      { date: '2026-10-01', amount: -1250 },
    ]);
  });
});

describe('delete transaction', () => {
  test('refuses an unknown ID (the SDK would silently succeed)', async () => {
    await expect(
      runAction({
        action: deleteTransaction,
        propsValue: { transaction_id: 'missing' },
      })
    ).rejects.toThrow('No transaction');
    expect(fake.deleteTransaction).not.toHaveBeenCalled();
  });
  test('deletes an existing ID', async () => {
    await expect(
      runAction({
        action: deleteTransaction,
        propsValue: { transaction_id: 't1' },
      })
    ).resolves.toEqual({ id: 't1', deleted: true });
    expect(fake.deleteTransaction).toHaveBeenCalledWith('t1');
  });
});

describe('update transaction', () => {
  test('sends only given fields; cleared=false is sent, not dropped', async () => {
    await runAction({
      action: updateTransaction,
      propsValue: { transaction_id: 't1', amount: -20, cleared: 'false' },
    });
    expect(fake.updateTransaction).toHaveBeenCalledWith('t1', {
      amount: -2000,
      cleared: false,
    });
  });
  test('clear notes sends null', async () => {
    await runAction({
      action: updateTransaction,
      propsValue: { transaction_id: 't1', clear_notes: true },
    });
    expect(fake.updateTransaction).toHaveBeenCalledWith('t1', { notes: null });
  });
  test('nothing to change fails', async () => {
    await expect(
      runAction({
        action: updateTransaction,
        propsValue: { transaction_id: 't1' },
      })
    ).rejects.toThrow('Nothing to update');
  });
  test('unknown transaction fails', async () => {
    await expect(
      runAction({
        action: updateTransaction,
        propsValue: { transaction_id: 'x', notes: 'a' },
      })
    ).rejects.toThrow('No transaction');
    expect(fake.updateTransaction).not.toHaveBeenCalled();
  });
});

describe('set budget amount', () => {
  test('sets cents for a known month and category', async () => {
    const out = await runAction({
      action: setBudgetAmount,
      propsValue: { month: '2026-10', category_id: 'c1', amount: 250 },
    });
    expect(fake.setBudgetAmount).toHaveBeenCalledWith('2026-10', 'c1', 25000);
    expect(out).toMatchObject({
      amount: 25000,
      amount_decimal: 250,
      category_name: 'Food',
    });
  });
  test('unknown month or category fails', async () => {
    await expect(
      runAction({
        action: setBudgetAmount,
        propsValue: { month: '2030-01', category_id: 'c1', amount: 1 },
      })
    ).rejects.toThrow('no month 2030-01');
    await expect(
      runAction({
        action: setBudgetAmount,
        propsValue: { month: '2026-10', category_id: 'zz', amount: 1 },
      })
    ).rejects.toThrow('No category');
    expect(fake.setBudgetAmount).not.toHaveBeenCalled();
  });
});

describe('run bank sync', () => {
  test('fails clearly when the account is not linked', async () => {
    await expect(
      runAction({ action: runBankSync, propsValue: { account_id: 'a1' } })
    ).rejects.toThrow('not linked to a bank');
    await expect(
      runAction({ action: runBankSync, propsValue: {} })
    ).rejects.toThrow('No open account');
    expect(fake.runBankSync).not.toHaveBeenCalled();
  });
  test('syncs a linked account', async () => {
    fake.state.accounts = [
      {
        id: 'a1',
        name: 'Checking',
        closed: false,
        account_sync_source: 'simpleFin',
      },
    ];
    await expect(
      runAction({ action: runBankSync, propsValue: {} })
    ).resolves.toMatchObject({
      success: true,
      synced_accounts: [{ id: 'a1' }],
    });
    expect(fake.runBankSync).toHaveBeenCalledWith({ accountId: 'a1' });
  });
});

describe('find transactions', () => {
  test('builds the filter, asks for limit+1 and reports truncation', async () => {
    fake.state.transactions = [{ ...TX }, { ...TX, id: 't2' }];
    const out = await runAction({
      action: findTransactions,
      propsValue: {
        start_date: '2026-10-01',
        end_date: '2026-10-31',
        account_id: 'a1',
        min_amount: -100,
        limit: 1,
      },
    });
    const query = fake.state.queries.at(-1);
    expect(query?.filter).toMatchObject({
      date: { $gte: '2026-10-01', $lte: '2026-10-31' },
      account: 'a1',
      amount: { $gte: -10000 },
    });
    expect(query?.limit).toBe(2);
    expect(out.count).toBe(1);
    expect(out.truncated).toBe(true);
    expect(out.transactions[0]).toMatchObject({
      amount_decimal: -12.5,
      payee_name: 'Kroger',
      category_name: 'Food',
      account_name: 'Checking',
    });
  });
  test('limit out of range fails', async () => {
    await expect(
      runAction({
        action: findTransactions,
        propsValue: { start_date: '2026-10-01', limit: 501 },
      })
    ).rejects.toThrow('Limit');
  });
});

describe('get budget month (ai)', () => {
  test('validates YYYY-MM', async () => {
    await expect(
      runAction({ action: getBudgetMonth, propsValue: { month: 'October' } })
    ).rejects.toThrow('YYYY-MM');
    await runAction({
      action: getBudgetMonth,
      propsValue: { month: '2026-10' },
    });
    expect(fake.getBudgetMonth).toHaveBeenCalledWith('2026-10');
  });
});

describe('writes are flushed before the result is built', () => {
  test('update calls sync() between updateTransaction and the re-read', async () => {
    await runAction({
      action: updateTransaction,
      propsValue: { transaction_id: 't1', notes: 'x' },
    });
    const updateOrder = fake.updateTransaction.mock.invocationCallOrder[0];
    const syncOrder = fake.sync.mock.invocationCallOrder[0];
    const readsAfterUpdate = fake.aqlQuery.mock.invocationCallOrder.filter(
      (order) => order > updateOrder
    );
    expect(syncOrder).toBeGreaterThan(updateOrder);
    expect(readsAfterUpdate.length).toBeGreaterThan(0);
    expect(readsAfterUpdate.every((order) => order > syncOrder)).toBe(true);
  });
  test('delete calls sync()', async () => {
    await runAction({
      action: deleteTransaction,
      propsValue: { transaction_id: 't1' },
    });
    expect(fake.sync).toHaveBeenCalled();
  });
});
