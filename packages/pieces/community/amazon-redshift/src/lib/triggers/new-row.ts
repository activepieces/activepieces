import { createTrigger, isNil, ServerContext, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { redshiftAuth } from '../auth';
import { redshiftClient } from '../common/client';
import { redshiftProps } from '../common/props';
import { redshiftUtils } from '../common/utils';
import { newRowOutputSchema } from '../output-schemas';
import type { RedshiftAuthValue, RedshiftRow } from '../common/types';

const props = {
  table: redshiftProps.table({ required: true }),
  order_by: redshiftProps.column({
    required: true,
    displayName: 'Order By Column',
    description: 'A unique column that grows with every new row, ideally an auto-increment id. Rows that share a value with an earlier row, or that commit after a row with a higher value, can be missed, so avoid timestamps.',
  }),
};

const MAX_ROWS = 1000;
const EMPTY_TABLE_CURSOR = 0;

const polling: Polling<RedshiftAuthValue, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId, server }) => {
    if (!server) {
      throw new Error('Missing server context.');
    }
    const from = redshiftUtils.qualifiedName({ table: propsValue.table });
    const column = redshiftUtils.quoteIdentifier({ name: propsValue.order_by });
    const keyOf = (row: RedshiftRow) => String(row[propsValue.order_by]);
    if (lastItemId === EMPTY_TABLE_CURSOR) {
      return await fetchNewItems({ auth, server, from, column, keyOf, filter: `${column} IS NOT NULL`, params: [] });
    }
    if (typeof lastItemId !== 'string') {
      const { rows } = await redshiftClient.runSql({ auth, server, sql: `SELECT * FROM ${from} WHERE ${column} IS NOT NULL ORDER BY ${column} DESC LIMIT 5` });
      return rows.map((row) => ({ id: keyOf(row), data: row }));
    }
    return await fetchNewItems({ auth, server, from, column, keyOf, filter: `${column} > $1`, params: [lastItemId] });
  },
};

async function fetchNewItems({ auth, server, from, column, keyOf, filter, params }: FetchNewItemsParams): Promise<{ id: string; data: RedshiftRow }[]> {
  const toItems = (rows: RedshiftRow[]) => rows.map((row) => ({ id: keyOf(row), data: row }));
  const { rows } = await redshiftClient.runSql({ auth, server, sql: `SELECT * FROM ${from} WHERE ${filter} ORDER BY ${column} ASC LIMIT ${MAX_ROWS}`, params });
  if (rows.length < MAX_ROWS) {
    return toItems(rows).reverse();
  }
  const lastKey = keyOf(rows[rows.length - 1]);
  if (keyOf(rows[0]) !== lastKey) {
    return toItems(rows.filter((row) => keyOf(row) !== lastKey)).reverse();
  }
  const { rows: sameKey } = await redshiftClient.runSql({ auth, server, sql: `SELECT * FROM ${from} WHERE ${column} = $1`, params: [lastKey] });
  return toItems(sameKey);
}

export const newRow = createTrigger({
  auth: redshiftAuth,
  name: 'new_row',
  classification: 'READ',
  displayName: 'New Row',
  description: 'Triggers when a new row is added to a table.',
  aiMetadata: {
    description: 'Fires once for each new row in an Amazon Redshift table, found by polling and ordering on a column that grows with every insert (an id or created timestamp). Each event carries one row.',
  },
  props,
  sampleData: { id: 1, name: 'Example', created_at: '2026-01-01 00:00:00' },
  outputSchema: newRowOutputSchema,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
    if (isNil(await context.store.get('lastItem'))) {
      await context.store.put('lastItem', EMPTY_TABLE_CURSOR);
    }
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

type FetchNewItemsParams = {
  auth: RedshiftAuthValue;
  server: ServerContext;
  from: string;
  column: string;
  keyOf: (row: RedshiftRow) => string;
  filter: string;
  params: unknown[];
};
