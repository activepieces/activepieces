import { randomUUID } from 'node:crypto';
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
    await enableCheckpoint({
      auth: context.auth.props,
      accountId: optionalId(context.propsValue.account_id),
      store: context.store,
      isRepublish: context.isRepublish === true,
    });
  },
  async onDisable() {
    return;
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

export async function enableCheckpoint({
  auth,
  accountId,
  store,
  isRepublish,
}: {
  auth: ActualAuthProps;
  accountId: string | undefined;
  store: Store;
  isRepublish: boolean;
}): Promise<void> {
  if (
    isRepublish &&
    readCheckpoint({ value: await store.get<unknown>(SEEN_KEY) }) !== null
  ) {
    return;
  }
  const { seen } = await pollNewTransactions({ auth, accountId, seen: null });
  await saveSeenIds({ store, ids: seen });
}

export async function loadSeenIds({
  store,
}: {
  store: Store;
}): Promise<string[] | null> {
  const checkpoint = readCheckpoint({
    value: await store.get<unknown>(SEEN_KEY),
  });
  if (checkpoint === null) return null;
  const ids: string[] = [];
  for (let index = 0; index < checkpoint.chunks; index++) {
    const chunk = await store.get<string[]>(
      chunkKey({ generation: checkpoint.generation, index })
    );
    if (!Array.isArray(chunk)) {
      throw new Error(
        'The saved list of seen transactions is incomplete. Disable and re-enable the trigger to reset it.'
      );
    }
    ids.push(...chunk);
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
  const previous = readCheckpoint({ value: await store.get<unknown>(SEEN_KEY) });
  if (ids === null) {
    await store.delete(SEEN_KEY);
    if (previous !== null) {
      await deleteChunks({
        store,
        generation: previous.generation,
        from: 0,
        to: previous.chunks,
      });
    }
    return;
  }
  // Every save writes under a fresh generation ID instead of reusing two slots.
  // Overlapping polls (one overrunning the polling interval) each write their own
  // keys and delete only the generation they read before writing, which can never
  // be one a later save made live. An overlap leaves orphaned chunks at worst.
  const generation = randomUUID();
  const chunks = Math.ceil(ids.length / SEEN_CHUNK_SIZE);
  let written = 0;
  try {
    for (; written < chunks; written++) {
      await store.put(
        chunkKey({ generation, index: written }),
        ids.slice(written * SEEN_CHUNK_SIZE, (written + 1) * SEEN_CHUNK_SIZE)
      );
    }
  } catch (error) {
    // Nothing points at this generation yet, so dropping its partial chunks is safe.
    await deleteChunks({ store, generation, from: 0, to: written + 1 }).catch(
      () => undefined
    );
    throw error;
  }
  const checkpoint: SeenCheckpoint = { generation, chunks };
  await store.put(SEEN_KEY, checkpoint);
  if (previous !== null) {
    await deleteChunks({
      store,
      generation: previous.generation,
      from: 0,
      to: previous.chunks,
    }).catch(() => undefined);
  }
}

async function deleteChunks({
  store,
  generation,
  from,
  to,
}: {
  store: Store;
  generation: string;
  from: number;
  to: number;
}): Promise<void> {
  for (let index = from; index < to; index++) {
    await store.delete(chunkKey({ generation, index }));
  }
}

function readCheckpoint({ value }: { value: unknown }): SeenCheckpoint | null {
  if (typeof value !== 'object' || value === null) return null;
  const generation = Reflect.get(value, 'generation');
  const chunks = Reflect.get(value, 'chunks');
  if (
    typeof generation !== 'string' ||
    generation === '' ||
    typeof chunks !== 'number'
  ) {
    return null;
  }
  return { generation, chunks };
}

function chunkKey({
  generation,
  index,
}: {
  generation: string;
  index: number;
}): string {
  return `${SEEN_KEY}_${generation}_${index}`;
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

type SeenCheckpoint = { generation: string; chunks: number };
