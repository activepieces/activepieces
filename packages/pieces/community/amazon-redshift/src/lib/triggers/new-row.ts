import { createTrigger, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { createHash } from 'crypto';
import { redshiftAuth } from '../auth';
import { redshiftClient } from '../common/client';
import { redshiftProps } from '../common/props';
import { redshiftUtils } from '../common/utils';
import type { RedshiftAuthValue } from '../common/types';

const props = {
  table: redshiftProps.table({ required: true }),
  order_by: redshiftProps.column({
    required: true,
    displayName: 'Order By Column',
    description: 'A column that grows with every new row, like an auto-increment id or a created timestamp.',
  }),
};

const MAX_ROWS = 1000;

const polling: Polling<RedshiftAuthValue, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId, server }) => {
    if (!server) {
      throw new Error('Missing server context.');
    }
    const from = redshiftUtils.qualifiedName({ table: propsValue.table });
    const column = redshiftUtils.quoteIdentifier({ name: propsValue.order_by });
    const lastKey = typeof lastItemId === 'string' ? lastItemId.slice(lastItemId.indexOf('|') + 1) : undefined;
    const { rows } = await redshiftClient.runSql({
      auth,
      server,
      sql: lastKey === undefined
        ? `SELECT * FROM ${from} WHERE ${column} IS NOT NULL ORDER BY ${column} DESC LIMIT 5`
        : `SELECT * FROM ${from} WHERE ${column} >= $1 ORDER BY ${column} DESC LIMIT ${MAX_ROWS}`,
      params: lastKey === undefined ? [] : [lastKey],
    });
    return rows.map((row) => ({
      id: `${createHash('md5').update(JSON.stringify(row)).digest('hex')}|${String(row[propsValue.order_by])}`,
      data: row,
    }));
  },
};

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
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
