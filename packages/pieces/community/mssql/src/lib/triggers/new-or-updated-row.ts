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
  mssqlGetIdentityColumn,
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

// The cursor is JSON rather than delimiter-joined text. Joining invited two
// bugs: an ordering value containing the delimiter truncated the marker, and
// composite keys collided ("a~b","c" and "a","b~c" both give a~b~c). JSON also
// preserves the value's type, so a text column holding "00123" comes back as
// the string it is instead of being guessed into a number and bound as an INT
// against an NVARCHAR column.
type Encoded = unknown;

function encodeValue(value: unknown): Encoded {
  if (value instanceof Date) return { __d: value.toISOString() };
  if (Buffer.isBuffer(value)) return { __b: value.toString('hex') };
  return value ?? null;
}

function decodeValue(value: Encoded): unknown {
  if (value !== null && typeof value === 'object') {
    const tagged = value as Record<string, string>;
    if ('__d' in tagged) return new Date(tagged['__d']);
    if ('__b' in tagged) return Buffer.from(tagged['__b'], 'hex');
  }
  return value;
}

function decodeMarker(id: unknown): unknown {
  try {
    const parts = JSON.parse(String(id));
    return Array.isArray(parts) ? decodeValue(parts[0]) : undefined;
  } catch {
    return undefined;
  }
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

    const marker = lastItemId === null || lastItemId === undefined
      ? undefined
      : decodeMarker(lastItemId);
    const target = quoteTable(table);
    const column = quoteId(order_by);

    const pool = await mssqlConnect(auth);
    try {
      // dedupe slices positionally on an exact id, so the ordering must be a
      // total order: rows tied on the chosen column (one multi-row INSERT gives
      // them all the same timestamp) would otherwise shift between polls and be
      // dropped or replayed. A key breaks the tie. Without one, ordering falls
      // back to every sortable column and identity is hashed over exactly those
      // same columns -- hashing the whole row instead would hand different ids
      // to rows that SQL cannot tell apart, reintroducing the shifting.
      // An IDENTITY column is preferred over the declared key because it is
      // monotonic: the cursor keeps the newest row seen, so a row added later
      // that ties on the ordering column must sort ahead of it to be noticed.
      // A non-monotonic key (a natural code, say) can place a new tied row
      // behind the cursor, where it is indistinguishable from an old one.
      const identity = await mssqlGetIdentityColumn(pool, table);
      const keyColumns = identity
        ? [identity]
        : await mssqlGetKeyColumns(pool, table);
      const tieColumns =
        keyColumns.length > 0
          ? keyColumns
          : await mssqlGetSortableColumns(pool, table);

      // The identity tiebreaker is pinned DESC rather than following
      // order_direction: newest means highest identity whichever way the chosen
      // column runs, and inheriting ASC would sort every newly inserted tied row
      // behind the cursor, guaranteeing the misses this is meant to prevent.
      // Repeating a column in ORDER BY is an error, hence the filter.
      const tieDirection = identity ? 'DESC' : order_direction;
      const orderBy = [
        `${quoteId(order_by)} ${order_direction}`,
        ...tieColumns
          .filter((c) => c !== order_by)
          .map((c) => `${quoteId(c)} ${tieDirection}`),
      ].join(', ');

      // first run takes only the newest page; later runs walk back to the marker
      const hasMarker = marker !== undefined;
      const query = hasMarker
        ? `SELECT * FROM ${target} WHERE ${column} ${
            order_direction === 'ASC' ? '<=' : '>='
          } @marker ORDER BY ${orderBy}`
        : `SELECT TOP (${PAGE_SIZE}) * FROM ${target} ORDER BY ${orderBy}`;

      const request = pool.request();
      if (hasMarker) {
        request.input('marker', marker);
      }
      const result = await request.query<Record<string, unknown>>(query);
      return (result.recordset ?? []).map((row) => {
        const discriminator =
          keyColumns.length > 0
            ? keyColumns.map((c) => encodeValue(row[c]))
            : [
                crypto
                  .createHash('md5')
                  .update(JSON.stringify(tieColumns.map((c) => encodeValue(row[c]))))
                  .digest('hex'),
              ];
        return {
          id: JSON.stringify([encodeValue(row[order_by]), ...discriminator]),
          data: row,
        };
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
      Order by a **created** timestamp or an auto-incrementing **id** to catch new rows only. Order by a **last-modified** timestamp to catch edits too — but the column must change on every update, otherwise edits go unnoticed.
      \n
      Works best on a table with an **identity column, primary key or unique constraint**, which lets rows sharing an order value be told apart.
      \n
      Two limits worth knowing. If the table has no key at all, rows identical in every column cannot be told apart, so a second identical row may not raise its own event. And if rows can be added with an order value equal to one already seen *and* a key that sorts below it — possible when the key is a natural code rather than an identity — such a row can be missed. Ordering by an identity column, or on a table that has one, avoids both.`,
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
