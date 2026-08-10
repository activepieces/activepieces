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
// ceiling on the catch-up window, so a stale cursor cannot pull a whole table
// into the engine process in one poll
const CATCH_UP_LIMIT = 1000;

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

function decodeMarker(id: unknown): unknown[] | undefined {
  try {
    const parts = JSON.parse(String(id));
    return Array.isArray(parts) ? parts.map(decodeValue) : undefined;
  } catch {
    return undefined;
  }
}

// rows the boundary tie group has already delivered, keyed by the boundary's
// canonical value -- md5 per id keeps the store entry small and bounded
type TieSeen = { v: string; ids?: string[]; overflow?: boolean };

const TIE_SEEN_LIMIT = 2000;

const digest = (text: string) =>
  crypto.createHash('md5').update(text).digest('hex');

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof mssqlAuth>,
  Props
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId, store }) => {
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
      // immutable as well as unique: a natural key column can be edited, which
      // changes the row's id and makes it look like a new row once.
      const identity = await mssqlGetIdentityColumn(pool, table);
      const keyColumns = identity
        ? [identity]
        : await mssqlGetKeyColumns(pool, table);
      const keyed = keyColumns.length > 0;
      const tieColumns = keyed
        ? keyColumns
        : await mssqlGetSortableColumns(pool, table);

      // The identity tiebreaker is pinned DESC rather than following
      // order_direction: newest means highest identity whichever way the chosen
      // column runs, and inheriting ASC would sort every newly inserted tied row
      // behind the cursor, guaranteeing the misses this is meant to prevent.
      // Repeating a column in ORDER BY is an error, hence the filter.
      const tieDirection = identity ? 'DESC' : order_direction;
      const cursorColumns = [
        { name: order_by, direction: order_direction },
        ...tieColumns
          .filter((c) => c !== order_by)
          .map((c) => ({ name: c, direction: tieDirection as OrderDirection })),
      ];
      const orderBy = cursorColumns
        .map((c) => `${quoteId(c.name)} ${c.direction}`)
        .join(', ');

      // A NULL ordering value cannot serve as a boundary: every comparison
      // against it is UNKNOWN, so once such a row became the cursor the trigger
      // matched nothing ever again. Those rows are excluded outright.
      const notNull = `${column} IS NOT NULL`;

      // The keyset comparison is only used when the tiebreakers are key columns,
      // which are NOT NULL by construction. On a keyless table the tiebreakers
      // are ordinary columns that may be NULL, and a NULL there makes its
      // comparison UNKNOWN, dropping a row that is genuinely newer. That case
      // bounds on the ordering column alone: a wider window, never a lossy one.
      // A cursor written before the key detection changed would also bind its
      // values against the wrong columns, so it is discarded rather than trusted.
      const shape = JSON.stringify(cursorColumns.map((c) => c.name));
      const shapeChanged =
        marker !== undefined &&
        ((await store.get<string>('cursorShape')) ?? shape) !== shape;
      await store.put('cursorShape', shape);

      // The boundary is the ordering value alone, held at >= (or <= ascending)
      // so the whole tie group at that value stays inside the window. Bounding
      // on the key as well looked cleaner but could not work: a later tied row
      // whose key sorts behind the saved one is outside a keyset window, and a
      // marker key is mutable anyway. Which tie rows are genuinely new is
      // decided here instead, against a stored digest set of the ones already
      // delivered at that value.
      const boundary = marker !== undefined && !shapeChanged ? marker[0] : undefined;
      const bounded = boundary !== undefined && boundary !== null;
      const seen = bounded
        ? await store.get<TieSeen>('tieSeen')
        : null;
      const boundaryKey = bounded ? JSON.stringify(encodeValue(boundary)) : '';
      const seenAtBoundary = seen && seen.v === boundaryKey ? seen : null;

      // A tie group that outgrew the seen set cannot be deduped row by row, so
      // the window goes strict and skips it: possible misses inside one
      // oversized group, never an endless replay of it.
      const operator = order_direction === 'ASC' ? '<' : '>';
      const where = bounded
        ? `${notNull} AND ${column} ${operator}${seenAtBoundary?.overflow ? '' : '='} @m0`
        : notNull;

      // Always capped. An unbounded catch-up could buffer an entire table into
      // the engine process; maxItemsToPoll only trims after the rows landed.
      const limit = bounded ? CATCH_UP_LIMIT : PAGE_SIZE;
      const query = `SELECT TOP (${limit}) * FROM ${target} WHERE ${where} ORDER BY ${orderBy}`;

      const request = pool.request();
      if (bounded) {
        request.input('m0', boundary);
      }
      const result = await request.query<Record<string, unknown>>(query);

      // With a key the id is the cursor columns' values verbatim. Without one
      // the tiebreakers are every sortable column, and storing those can blow
      // the store's value limit on a wide table, so they collapse to a digest.
      const fetched = (result.recordset ?? []).map((row) => {
        const values = cursorColumns.map((c) => encodeValue(row[c.name]));
        return {
          id: JSON.stringify(
            keyed ? values : [values[0], digest(JSON.stringify(values))]
          ),
          oKey: JSON.stringify(values[0]),
          data: row,
        };
      });

      const seenIds = new Set(seenAtBoundary?.ids ?? []);
      const fresh = fetched.filter(
        (item) => item.oKey !== boundaryKey || !seenIds.has(digest(item.id))
      );

      // Remember the tie group at the next boundary so its rows are not
      // redelivered, and are not lost either when a later tied row arrives.
      const nextBoundaryKey = fresh[0]?.oKey ?? (bounded ? boundaryKey : fetched[0]?.oKey);
      if (nextBoundaryKey !== undefined) {
        const carried =
          nextBoundaryKey === boundaryKey ? seenAtBoundary?.ids ?? [] : [];
        let atBoundary = fetched
          .filter((item) => item.oKey === nextBoundaryKey)
          .map((item) => digest(item.id));
        // The first fetch is a short page, so a pre-existing tie group larger
        // than the page would be only partly remembered and the remainder
        // delivered as new on the next poll. Seed the set from the whole group.
        if (!bounded && fetched.length > 0) {
          const seedColumns = cursorColumns
            .map((c) => quoteId(c.name))
            .join(', ');
          const seed = await pool
            .request()
            .input('v', result.recordset[0][order_by])
            .query<Record<string, unknown>>(
              `SELECT TOP (${TIE_SEEN_LIMIT + 1}) ${seedColumns} FROM ${target} WHERE ${column} = @v`
            );
          atBoundary = (seed.recordset ?? []).map((row) => {
            const values = cursorColumns.map((c) => encodeValue(row[c.name]));
            return digest(
              JSON.stringify(
                keyed ? values : [values[0], digest(JSON.stringify(values))]
              )
            );
          });
        }
        const ids = [...new Set([...carried, ...atBoundary])];
        await store.put<TieSeen>(
          'tieSeen',
          ids.length > TIE_SEEN_LIMIT
            ? { v: nextBoundaryKey, overflow: true }
            : { v: nextBoundaryKey, ids }
        );
      }

      // The sentinel pins the positional slice: everything before it is what
      // this filter decided is new, and the stored marker id stays discoverable
      // even after the row it once described was edited.
      const items: { id: unknown; data: unknown }[] = fresh.map(
        ({ id, data }) => ({ id, data })
      );
      if (marker !== undefined && !shapeChanged) {
        items.push({ id: lastItemId, data: null });
      }
      return items;
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
      Rows where the chosen column is **empty** are skipped, since an empty value cannot mark a position to resume from.
      \n
      Two further limits. If the table has no key at all, rows identical in every column cannot be told apart, so a second identical row may not raise its own event. And a change that moves a row's order value **backwards**, behind rows already seen, goes unnoticed — the trigger only ever looks forward from the newest value it has delivered.`,
    }),
    table: mssqlProps.table(),
    order_by: mssqlProps.column(
      'Column to order by',
      'Use a created timestamp, a last-modified timestamp, or an auto-incrementing id.',
      true,
      true
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
    const { store, auth, propsValue, isRepublish } = context;
    await pollingHelper.onEnable(polling, { store, propsValue, auth, isRepublish });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, propsValue, auth });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
