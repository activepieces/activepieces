import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import crypto from 'crypto';
import { mssqlAuth } from '../auth';
import { MssqlTable, mssqlConnect, quoteId, quoteTable } from '../common';
import { mssqlProps } from '../common/props';

type OrderDirection = 'ASC' | 'DESC';

type Props = {
  table: MssqlTable;
  order_by: string;
  order_direction: OrderDirection | undefined;
};

const PAGE_SIZE = 5;

// the marker is stored as a string, but comparing it against a numeric or
// datetime column as text stops SQL Server using that column's index
function typedMarker(marker: string): string | number | Date {
  if (/^-?\d+(\.\d+)?$/.test(marker)) {
    return Number(marker);
  }
  const asDate = new Date(marker);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate;
  }
  return marker;
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof mssqlAuth>,
  Props
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const { table, order_by, order_direction } = propsValue;
    if (order_direction !== 'ASC' && order_direction !== 'DESC') {
      throw new Error(
        `Invalid order direction: ${JSON.stringify(order_direction)}`
      );
    }

    const marker = lastItemId
      ? (lastItemId as string).split('|')[0]
      : undefined;
    const target = quoteTable(table);
    const column = quoteId(order_by);

    // first run takes only the newest page; later runs walk back to the marker
    const query = marker
      ? `SELECT * FROM ${target} WHERE ${column} ${
          order_direction === 'ASC' ? '<=' : '>='
        } @marker ORDER BY ${column} ${order_direction}`
      : `SELECT TOP (${PAGE_SIZE}) * FROM ${target} ORDER BY ${column} ${order_direction}`;

    const pool = await mssqlConnect(auth);
    try {
      const request = pool.request();
      if (marker) {
        request.input('marker', typedMarker(marker));
      }
      const result = await request.query<Record<string, unknown>>(query);
      return (result.recordset ?? []).map((row) => {
        const value = row[order_by];
        const orderValue =
          value instanceof Date ? value.toISOString() : String(value);
        const rowHash = crypto
          .createHash('md5')
          .update(JSON.stringify(row))
          .digest('hex');
        return { id: `${orderValue}|${rowHash}`, data: row };
      });
    } finally {
      await pool.close();
    }
  },
};

export const newOrUpdatedRow = createTrigger({
  auth: mssqlAuth,
  name: 'new-or-updated-row',
  displayName: 'New or Updated Row',
  description: 'Fires when a row is added to, or changed in, a table',
  aiMetadata: {
    description:
      'Fires when a row appears or changes in a selected SQL Server table, detected by polling and ordering on a chosen column. Order by a created timestamp or an identity id to catch only new rows, or by a last-modified timestamp to catch edits as well. Each event carries one row.',
  },
  props: {
    description: Property.MarkDown({
      value: `**How this works:** the trigger reads the most recent rows using the column you order by, then keeps polling until it reaches the last row it already saw.
      \n
      Order by a **created** timestamp or an auto-incrementing **id** to catch new rows only. Order by a **last-modified** timestamp to catch edits too — but the column must change on every update, otherwise edits go unnoticed.`,
    }),
    table: mssqlProps.table(),
    order_by: mssqlProps.column(
      'Column to order by',
      'Use a created timestamp, a last-modified timestamp, or an auto-incrementing id.'
    ),
    order_direction: Property.StaticDropdown<OrderDirection>({
      displayName: 'Order Direction',
      description:
        'The direction that puts the newest rows first. Descending is right for almost every table.',
      required: true,
      defaultValue: 'DESC',
      options: {
        options: [
          { label: 'Descending', value: 'DESC' },
          { label: 'Ascending', value: 'ASC' },
        ],
      },
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
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
