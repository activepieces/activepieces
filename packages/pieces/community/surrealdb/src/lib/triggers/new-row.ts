import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { surrealdbAuth } from '../..';
import client from '../common';
import crypto from 'crypto';

// replace auth with piece auth variable
const polling: Polling<
  PiecePropValueSchema<typeof surrealdbAuth>,
  {
    table: string;
    order_by: string;
    order_direction: 'ASC' | 'DESC' | undefined;
  }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const lastItem = lastItemId as string;
    const query = constructQuery({
      order_by: propsValue.order_by,
      lastItem: lastItem,
      order_direction: propsValue.order_direction,
    });

    const authProps = auth as PiecePropValueSchema<typeof surrealdbAuth>;
    const result = await client.query(authProps, query, {
      table: propsValue.table,
    });

    const items = result.body[0].result.map(function (
      row: Record<string, any>
    ) {
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
  lastItem: string;
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

export const newRow = createTrigger({
  name: 'new-row',
  displayName: 'New Row',
  description: 'Triggers when a new row is added to the defined table.',
  props: {
    description: Property.MarkDown({
      value: `**NOTE:** The trigger fetches the latest rows using the provided order by column (newest first), and then will keep polling until the previous last row is reached. It's suggested to add a created_at timestamp. \`DEFINE FIELD OVERWRITE createdAt ON schedule VALUE time::now() READONLY;\``,
    }),
    table: Property.Dropdown({
      displayName: 'Table name',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }
        const authProps = auth as PiecePropValueSchema<typeof surrealdbAuth>;
        try {
          const result = await client.query(authProps, 'INFO FOR DB');
          const options = Object.keys(result.body[0].result.tables).map(
            (row) => ({
              label: row,
              value: row,
            })
          );
          return {
            disabled: false,
            options,
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: JSON.stringify(e),
          };
        }
      },
    }),
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
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, propsValue, auth });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, propsValue, auth });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
