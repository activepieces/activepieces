import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { ActualApi, ActualAuthProps, withBudget } from '../common/client';
import {
  MappedTransaction,
  RawTransaction,
  daysAgo,
  loadLookups,
  mapTransaction,
  optionalId,
  queryTransactions,
} from '../common/helpers';
import { actualOutputSchemas } from '../common/output-schemas';
import { accountDropdown } from '../common/props';
export const LOOKBACK_DAYS = 7;
export const MAX_SEEN = 5000;
const SEEN_KEY = 'actual_seen_transaction_ids';

export async function pollNewTransactions(params: {
  auth: ActualAuthProps;
  accountId: string | undefined;
  seen: string[] | null;
  now?: Date;
}): Promise<{ emit: MappedTransaction[]; seen: string[] }> {
  return withBudget({
    auth: params.auth,
    fn: async (api) => {
      const rows = await fetchWindow({
        api,
        accountId: params.accountId,
        now: params.now ?? new Date(),
      });
      const windowIds = rows.map((tx) => tx.id);
      if (params.seen === null) {
        return { emit: [], seen: windowIds.slice(-MAX_SEEN) };
      }
      const seen = new Set(params.seen);
      const fresh = rows.filter((tx) => !seen.has(tx.id));
      const lookups = fresh.length > 0 ? await loadLookups(api) : null;
      return {
        emit: lookups ? fresh.map((tx) => mapTransaction({ tx, lookups })) : [],
        seen: windowIds.slice(-MAX_SEEN),
      };
    },
  });
}

export const newTransaction = createTrigger({
  auth: actualBudgetAuth,
  name: 'new_transaction',
  displayName: 'New Transaction',
  description: `Triggers when a transaction dated within the last ${LOOKBACK_DAYS} days (or later) is added to an account. Split transactions trigger once, with their splits.`,
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for each new transaction dated within the last 7 days, optionally limited to one account. Each event is the transaction with amount (integer cents), amount_decimal, account, payee and category IDs and names, notes, cleared state and splits under subtransactions.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    account_id: accountDropdown({
      required: false,
      description:
        'Only watch this account. Leave empty to watch all accounts.',
    }),
  },
  outputSchema: actualOutputSchemas.newTransaction,
  sampleData: {
    id: 'f083c14f-7b87-48e7-bee9-2322336fa817',
    date: '2026-10-20',
    amount: -1250,
    amount_decimal: -12.5,
    account: 'a8e4ebc9-d5cd-4a87-a010-4be80e383cc5',
    account_name: 'Checking',
    payee: '11aa43b5-81f0-4c17-aa82-a0ee0a20c082',
    payee_name: 'Kroger',
    imported_payee: 'Kroger',
    category: '541836f1-e756-4473-a5d0-6c1d3f06c7fa',
    category_name: 'Food',
    notes: null,
    imported_id: null,
    transfer_id: null,
    cleared: true,
    reconciled: false,
    is_parent: false,
    starting_balance_flag: false,
    subtransactions: [],
  },
  async onEnable(context) {
    const { seen } = await pollNewTransactions({
      auth: context.auth.props,
      accountId: optionalId(context.propsValue.account_id),
      seen: null,
    });
    await context.store.put(SEEN_KEY, seen);
  },
  async onDisable(context) {
    await context.store.delete(SEEN_KEY);
  },
  async run(context) {
    const stored = await context.store.get<string[]>(SEEN_KEY);
    const { emit, seen } = await pollNewTransactions({
      auth: context.auth.props,
      accountId: optionalId(context.propsValue.account_id),
      seen: stored ?? null,
    });
    await context.store.put(SEEN_KEY, seen);
    return emit;
  },
  async test(context) {
    return withBudget({
      auth: context.auth.props,
      fn: async (api) => {
        const accountId = optionalId(context.propsValue.account_id);
        const filter: Record<string, unknown> = accountId
          ? { account: accountId }
          : {};
        const rows = await queryTransactions({
          api,
          query: api
            .q('transactions')
            .filter(filter)
            .select('*')
            .options({ splits: 'grouped' })
            .orderBy([{ date: 'desc' }, { sort_order: 'desc' }])
            .limit(5),
        });
        const lookups = await loadLookups(api);
        return rows.map((tx) => mapTransaction({ tx, lookups }));
      },
    });
  },
});

async function fetchWindow({
  api,
  accountId,
  now,
}: {
  api: ActualApi;
  accountId: string | undefined;
  now: Date;
}): Promise<RawTransaction[]> {
  const filter: Record<string, unknown> = {
    date: { $gte: daysAgo({ days: LOOKBACK_DAYS, now }) },
  };
  if (accountId) filter['account'] = accountId;
  return queryTransactions({
    api,
    query: api
      .q('transactions')
      .filter(filter)
      .select('*')
      .options({ splits: 'grouped' })
      .orderBy([{ date: 'asc' }, { sort_order: 'asc' }]),
  });
}
