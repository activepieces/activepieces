import { Store, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
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
export const SEEN_CHUNK_SIZE = 5000;
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
        return { emit: [], seen: windowIds };
      }
      const seen = new Set(params.seen);
      const fresh = rows.filter((tx) => !seen.has(tx.id));
      const lookups = fresh.length > 0 ? await loadLookups(api) : null;
      return {
        emit: lookups ? fresh.map((tx) => mapTransaction({ tx, lookups })) : [],
        seen: windowIds,
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
    await saveSeenIds({ store: context.store, ids: seen });
  },
  async onDisable(context) {
    await saveSeenIds({ store: context.store, ids: null });
  },
  async run(context) {
    const stored = await loadSeenIds({ store: context.store });
    const { emit, seen } = await pollNewTransactions({
      auth: context.auth.props,
      accountId: optionalId(context.propsValue.account_id),
      seen: stored,
    });
    await saveSeenIds({ store: context.store, ids: seen });
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

export async function loadSeenIds({
  store,
}: {
  store: Store;
}): Promise<string[] | null> {
  const chunkCount = await store.get<number>(SEEN_KEY);
  if (typeof chunkCount !== 'number') return null;
  const ids: string[] = [];
  for (let index = 0; index < chunkCount; index++) {
    const chunk = await store.get<string[]>(chunkKey({ index }));
    if (Array.isArray(chunk)) ids.push(...chunk);
  }
  return ids;
}

export async function saveSeenIds({
  store,
  ids,
}: {
  store: Store;
  ids: string[] | null;
}): Promise<void> {
  const previous = await store.get<number>(SEEN_KEY);
  const previousCount = typeof previous === 'number' ? previous : 0;
  if (ids === null) {
    await store.delete(SEEN_KEY);
    await deleteChunks({ store, from: 0, to: previousCount });
    return;
  }
  const chunkCount = Math.ceil(ids.length / SEEN_CHUNK_SIZE);
  for (let index = 0; index < chunkCount; index++) {
    await store.put(
      chunkKey({ index }),
      ids.slice(index * SEEN_CHUNK_SIZE, (index + 1) * SEEN_CHUNK_SIZE)
    );
  }
  await store.put(SEEN_KEY, chunkCount);
  await deleteChunks({ store, from: chunkCount, to: previousCount });
}

async function deleteChunks({
  store,
  from,
  to,
}: {
  store: Store;
  from: number;
  to: number;
}): Promise<void> {
  for (let index = from; index < to; index++) {
    await store.delete(chunkKey({ index }));
  }
}

function chunkKey({ index }: { index: number }): string {
  return `${SEEN_KEY}_${index}`;
}

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
