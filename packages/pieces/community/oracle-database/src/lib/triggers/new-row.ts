import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import crypto from 'crypto';
import dayjs from 'dayjs';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';
import oracledb from 'oracledb';

type OrderDirection = 'ASC' | 'DESC';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof oracleDbAuth>,
  {
    tableName: string;
    orderBy: string;
    orderDirection: OrderDirection | undefined;
  }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const client = new OracleDbClient(auth.props);
    await client['connect']();

    if (!client['connection']) {
      throw new Error('Database connection failed');
    }

    const lastItem = lastItemId as string;
    const lastOrderKey = lastItem ? lastItem.split('|')[0] : null;
    const direction = propsValue.orderDirection || 'DESC';
    
    let sql: string;
    const binds: oracledb.BindParameters = {};

    if (lastOrderKey === null) {
      sql = `SELECT * FROM "${propsValue.tableName}" ORDER BY "${propsValue.orderBy}" ${direction} FETCH FIRST 5 ROWS ONLY`;
    } else {
      const operator = direction === 'DESC' ? '>=' : '<=';
      sql = `SELECT * FROM "${propsValue.tableName}" WHERE "${propsValue.orderBy}" ${operator} :lastKey ORDER BY "${propsValue.orderBy}" ${direction}`;
      binds['lastKey'] = lastOrderKey;
    }

    const result = await client['connection'].execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    await client.close();

    const rows = (result.rows as Record<string, any>[]) || [];
    const items = rows.map((row) => {
      const rowHash = crypto
        .createHash('md5')
        .update(JSON.stringify(row))
        .digest('hex');
      const isTimestamp = dayjs(row[propsValue.orderBy]).isValid();
      const orderValue = isTimestamp
        ? dayjs(row[propsValue.orderBy]).toISOString()
        : row[propsValue.orderBy];
      return {
        id: orderValue + '|' + rowHash,
        data: row,
      };
    });

    return items;
  },
};

export const newRowTrigger = createTrigger({
  auth: oracleDbAuth,
  name: 'new_row',
  displayName: 'New Row',
  description: 'Triggers when a new row is created',
  props: {
    description: Property.MarkDown({
      value: `**NOTE:** Fetches latest rows using the order column (newest first), then keeps polling for new rows.`,
    }),
    tableName: oracleDbProps.tableName(),
    orderBy: oracleDbProps.orderBy(),
    orderDirection: Property.StaticDropdown<OrderDirection>({
      displayName: 'Order Direction',
      description: 'Sort direction to fetch newest rows first',
      required: true,
      options: {
        options: [
          { label: 'Ascending', value: 'ASC' },
          { label: 'Descending', value: 'DESC' },
        ],
      },
      defaultValue: 'DESC',
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {},

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth,
    });
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth,
    });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },

  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});
