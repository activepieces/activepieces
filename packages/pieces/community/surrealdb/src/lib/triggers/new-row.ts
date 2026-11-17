import {
  createTrigger,
  TriggerStrategy,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import crypto from 'crypto';
import { surrealdbAuth } from '../auth';
import { surrealdbApi } from '../common/api';
import { surrealdbProps } from '../common/props';
import type { SurrealdbRow } from '../common/types';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof surrealdbAuth>,
  {
    table: string;
    order_by: string;
    order_direction: 'ASC' | 'DESC' | undefined;
  }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const lastItem = typeof lastItemId === 'string' ? lastItemId : undefined;
    const query = constructQuery({
      order_by: propsValue.order_by,
      lastItem: lastItem,
      order_direction: propsValue.order_direction,
    });

    const result = await surrealdbApi.query<SurrealdbRow[]>({
      auth,
      sql: query,
      args: {
        table: propsValue.table,
      },
    });

    const items = result[0].result.map(function (row) {
      const rowHash = crypto
        .createHash('md5')
        .update(JSON.stringify(row))
        .digest('hex');
      const isTimestamp = dayjs(row[propsValue.order_by]).isValid();
      const orderValue = isTimestamp
        ? dayjs(row[propsValue.order_by]).toISOString()
        : row[propsValue.order_by];
      return {
        id: orderValue + '|' + rowHash,
        data: row,
      };
    });

    return items;
  },
};

function constructQuery({
  order_by,
  lastItem,
  order_direction,
}: {
  order_by: string;
  order_direction: 'ASC' | 'DESC' | undefined;
  lastItem: string | undefined;
}): string {
  const lastOrderKey = lastItem ? lastItem.split('|')[0] : null;
  if (lastOrderKey === null) {
    switch (order_direction) {
      case 'ASC':
        return `SELECT * FROM type::table($table) ORDER BY ${order_by} ASC LIMIT 5`;
      case 'DESC':
        return `SELECT * FROM type::table($table) ORDER BY ${order_by} DESC LIMIT 5`;
      default:
        throw new Error(
          JSON.stringify({
            message: 'Invalid order direction',
            order_direction: order_direction,
          })
        );
    }
  } else {
    switch (order_direction) {
      case 'ASC':
        return `SELECT * FROM type::table($table) WHERE ${order_by} <= '${lastOrderKey}' ORDER BY ${order_by} ASC`;
      case 'DESC':
        return `SELECT * FROM type::table($table) WHERE ${order_by} >= '${lastOrderKey}' ORDER BY ${order_by} DESC`;
      default:
        throw new Error(
          JSON.stringify({
            message: 'Invalid order direction',
            order_direction: order_direction,
          })
        );
    }
  }
}

export const newRowTrigger = createTrigger({
  name: 'new-row',
  classification: 'READ',
  displayName: 'New Row',
  description: 'Triggers when a new row is added to the defined table.',
  aiMetadata: {
    description: 'Fires when a new row appears in the selected SurrealDB table. New rows are detected by polling and ordering on a chosen column (typically a created-at timestamp), so the table must have a reliable monotonic order-by field for detection to work correctly.',
  },
  props: {
    description: Property.MarkDown({
      value: `**NOTE:** The trigger fetches the latest rows using the provided order by column (newest first), and then will keep polling until the previous last row is reached. It's suggested to add a created_at timestamp. \`DEFINE FIELD OVERWRITE createdAt ON schedule VALUE time::now() READONLY;\``,
    }),
    table: surrealdbProps.table({ required: true }),
    order_by: Property.ShortText({
      displayName: 'Column to order by',
      description: 'Use something like a created timestamp.',
      required: true,
      defaultValue: 'created_at',
    }),
    order_direction: Property.StaticDropdown<'ASC' | 'DESC'>({
      displayName: 'Order Direction',
      description:
        'The direction to sort by such that the newest rows are fetched first.',
      required: true,
      options: {
        options: [
          {
            label: 'Ascending',
            value: 'ASC',
          },
          {
            label: 'Descending',
            value: 'DESC',
          },
        ],
      },
      defaultValue: 'DESC',
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  auth: surrealdbAuth,
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
