import { createMockActionContext } from '../../../framework/src/lib/test';
import {
  AppConnectionType,
  InputPropertyMap,
  StaticPropsValue,
  Action,
} from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { isRecord } from '../src/lib/common/helpers';
import { actualBudgetAuth } from '../src/lib/common/auth';

export type QueryCall = {
  table: string;
  filter: Record<string, unknown>;
  select: unknown;
  limit?: number;
};

export function createFakeApi() {
  const state: FakeState = {
    accounts: [],
    categories: [],
    groups: [],
    payees: [],
    transactions: [],
    months: ['2026-09', '2026-10'],
    queries: [],
    order: [],
    initDelayMs: 0,
    lastDataDir: '',
  };
  function q(table: string) {
    const call: QueryCall = { table, filter: {}, select: '*' };
    const builder = {
      filter(f: Record<string, unknown>) {
        call.filter = { ...call.filter, ...f };
        return builder;
      },
      select(s: unknown) {
        call.select = s;
        return builder;
      },
      options() {
        return builder;
      },
      orderBy() {
        return builder;
      },
      limit(n: number) {
        call.limit = n;
        return builder;
      },
      call,
    };
    return builder;
  }
  function matches({
    row,
    filter,
  }: {
    row: Record<string, unknown>;
    filter: Record<string, unknown>;
  }): boolean {
    return Object.entries(filter).every(([key, cond]) => {
      if (key === '$or') return true;
      const value = row[key];
      if (isRecord(cond)) {
        const c = cond;
        if ('$gte' in c && !(String(value) >= String(c['$gte']))) return false;
        if ('$lte' in c && !(String(value) <= String(c['$lte']))) return false;
        return true;
      }
      return value === cond;
    });
  }
  const api = {
    state,
    init: vi.fn(async (options: { dataDir: string }) => {
      state.order.push('init');
      state.lastDataDir = options.dataDir;
      if (state.initDelayMs)
        await new Promise((r) => setTimeout(r, state.initDelayMs));
    }),
    downloadBudget: vi.fn(async () => undefined),
    shutdown: vi.fn(async () => {
      state.order.push('shutdown');
    }),
    q,
    aqlQuery: vi.fn(async (builder: { call: QueryCall }) => {
      state.queries.push(builder.call);
      const source =
        builder.call.table === 'accounts' ? state.accounts : state.transactions;
      let data = source.filter((row) =>
        matches({ row, filter: builder.call.filter })
      );
      if (builder.call.limit !== undefined)
        data = data.slice(0, builder.call.limit);
      return { data };
    }),
    getAccounts: vi.fn(async () => state.accounts),
    getCategories: vi.fn(async () => state.categories),
    getCategoryGroups: vi.fn(async () => state.groups),
    getPayees: vi.fn(async () => state.payees),
    getAccountBalance: vi.fn(async () => 12345),
    getBudgetMonths: vi.fn(async () => state.months),
    getBudgetMonth: vi.fn(async (month: string) => ({
      month,
      categoryGroups: [
        {
          id: 'g1',
          categories: [{ id: 'c1', budgeted: 25000, balance: 25000 }],
        },
      ],
    })),
    setBudgetAmount: vi.fn(async () => undefined),
    importTransactions: vi.fn(
      async (): Promise<ImportOutcome> => ({
        added: ['t-new'],
        updated: [],
        errors: [],
      })
    ),
    updateTransaction: vi.fn(async () => []),
    deleteTransaction: vi.fn(async () => []),
    runBankSync: vi.fn(async () => undefined),
    sync: vi.fn(async () => undefined),
  };
  return api;
}

export const AUTH = {
  server_url: 'http://localhost:5006/',
  password: 'pw',
  sync_id: 'sync-1',
  encryption_password: '',
};

export function runAction<Props extends InputPropertyMap>({
  action,
  propsValue,
}: {
  action: Action<typeof actualBudgetAuth, Props>;
  propsValue: StaticPropsValue<Props>;
}) {
  return action.run({
    ...createMockActionContext<Props>({ propsValue }),
    auth: { type: AppConnectionType.CUSTOM_AUTH, props: AUTH },
  });
}
export const fake = createFakeApi();

type Row = Record<string, unknown>;

type FakeState = {
  accounts: Row[];
  categories: Row[];
  groups: Row[];
  payees: Row[];
  transactions: Row[];
  months: string[];
  queries: QueryCall[];
  order: string[];
  initDelayMs: number;
  lastDataDir: string;
};

type ImportOutcome = {
  added: string[];
  updated: string[];
  errors: Array<{ message: string }>;
};
