import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import crypto from 'crypto';
import { mssqlAuth } from '../auth';
import {
  MssqlTable,
  mssqlConnect,
  mssqlGetKeyColumns,
  mssqlGetSortableColumns,
  quoteId,
  quoteTable,
} from '../common';
import { mssqlProps } from '../common/props';

type OrderDirection = 'ASC' | 'DESC';

type Props = {
  table: MssqlTable;
  order_by: string;
  order_direction: OrderDirection | undefined;
};

const PAGE_SIZE = 5;

// comparing the stored marker as text stops SQL Server using the column's index
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

    const pool = await mssqlConnect(auth);
    try {
      // dedupe slices positionally on an exact id, so the ordering must be a
      // total order: rows tied on the chosen column (one multi-row INSERT gives
      // them all the same timestamp) would otherwise shift between polls and be
      // dropped or replayed. The primary key breaks the tie; a table without one
      // falls back to ordering on every sortable column, which leaves only
      // wholly identical rows tied, and those are interchangeable anyway.
      const keyColumns = await mssqlGetKeyColumns(pool, table);
      const tieColumns =
        keyColumns.length > 0
          ? keyColumns
          : await mssqlGetSortableColumns(pool, table);

      // repeating a column in ORDER BY is an error
      const orderBy = [order_by, ...tieColumns.filter((c) => c !== order_by)]
        .map((c) => `${quoteId(c)} ${order_direction}`)
        .join(', ');

      // first run takes only the newest page; later runs walk back to the marker
      const query = marker
        ? `SELECT * FROM ${target} WHERE ${column} ${
            order_direction === 'ASC' ? '<=' : '>='
          } @marker ORDER BY ${orderBy}`
        : `SELECT TOP (${PAGE_SIZE}) * FROM ${target} ORDER BY ${orderBy}`;

      const request = pool.request();
      if (marker) {
        request.input('marker', typedMarker(marker));
      }
      const result = await request.query<Record<string, unknown>>(query);
      return (result.recordset ?? []).map((row) => {
        const value = row[order_by];
        const orderValue =
          value instanceof Date ? value.toISOString() : String(value);
        const discriminator =
          keyColumns.length > 0
            ? keyColumns.map((c) => String(row[c])).join('~')
            : crypto.createHash('md5').update(JSON.stringify(row)).digest('hex');
        return { id: `${orderValue}|${discriminator}`, data: row };
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
