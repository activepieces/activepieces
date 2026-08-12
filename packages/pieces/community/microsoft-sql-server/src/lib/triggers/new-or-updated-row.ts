import {
  Property,
  TriggerStrategy,
  createTrigger,
  isNil,
} from '@activepieces/pieces-framework';
import sql from 'mssql';
import { mssqlAuth } from '../auth';
import { MssqlTable, mssqlConnect, mssqlGetTableMeta } from '../common';
import {
  Cursor,
  OrderDirection,
  Plan,
  baselineQuery,
  bindCursorValues,
  completeGroups,
  groupPageQuery,
  groupValueQuery,
  keysetPageQuery,
  newCursor,
  planCursor,
  positionOf,
  previewQuery,
  reconcile,
  stripPosition,
} from '../common/cursor';
import { mssqlProps } from '../common/props';

type Props = {
  table: MssqlTable;
  order_by: string;
  order_direction: OrderDirection | undefined;
  max_rows: number | undefined;
};

const CURSOR_KEY = 'cursor';

const DEFAULT_MAX_ROWS = 200;
const MAX_ROWS_CEILING = 1000;
const PREVIEW_ROWS = 5;
// Group mode has to hand a whole tie group over in one poll to stay exact, so
// there is a size past which it refuses instead of delivering part of one.
const GROUP_CEILING = 2000;

function rowLimit(requested: number | undefined): number {
  if (isNil(requested)) return DEFAULT_MAX_ROWS;
  const rows = Math.floor(Number(requested));
  if (!Number.isFinite(rows) || rows < 1) return DEFAULT_MAX_ROWS;
  return Math.min(rows, MAX_ROWS_CEILING);
}

async function buildPlan(
  pool: sql.ConnectionPool,
  propsValue: Props
): Promise<Plan> {
  return planCursor(
    await mssqlGetTableMeta(pool, propsValue.table),
    propsValue
  );
}

async function baseline(pool: sql.ConnectionPool, plan: Plan): Promise<Cursor> {
  const result = await pool
    .request()
    .query<Record<string, unknown>>(baselineQuery(plan));
  const row = (result.recordset ?? [])[0];
  // An empty table has nothing to skip, so the position stays null and the first
  // row ever written is delivered. Baselining to "the head" instead would make
  // that row the position and swallow it.
  return newCursor(plan, isNil(row) ? null : positionOf(plan, row));
}

type Page = { payloads: unknown[]; next: Cursor | null };

type Row = Record<string, unknown>;

const EMPTY: Page = { payloads: [], next: null };

// Oldest first. The drain already runs in that order, and a backlog of edits
// replayed newest-first would apply an older state after a newer one.
function deliver(plan: Plan, rows: Row[]): Page {
  if (rows.length === 0) return EMPTY;
  return {
    payloads: rows.map((row) => stripPosition(plan, row)),
    next: newCursor(plan, positionOf(plan, rows[rows.length - 1])),
  };
}

async function query(
  pool: sql.ConnectionPool,
  plan: Plan,
  text: string,
  limit: number,
  position: string[] | null
): Promise<Row[]> {
  const request = pool.request();
  request.input('limit', sql.Int, limit);
  if (position) {
    bindCursorValues(request, plan.columns, position);
  }
  return (await request.query<Row>(text)).recordset ?? [];
}

async function fetchKeysetPage(
  pool: sql.ConnectionPool,
  plan: Plan,
  cursor: Cursor,
  limit: number
): Promise<Page> {
  return deliver(
    plan,
    await query(pool, plan, keysetPageQuery(plan, cursor.k), limit, cursor.k)
  );
}

/**
 * Without anything unique to page on, the position can only sit between two
 * ordering values, so a value has to be delivered whole or not at all. One extra
 * row is fetched to see whether the page landed inside a value; if it did, that
 * value is left for the next poll.
 */
async function fetchGroupPage(
  pool: sql.ConnectionPool,
  plan: Plan,
  cursor: Cursor,
  limit: number
): Promise<Page> {
  const rows = await query(
    pool,
    plan,
    groupPageQuery(plan, cursor.k),
    limit + 1,
    cursor.k
  );
  const { ready, oversized } = completeGroups(plan, rows, limit);
  if (isNil(oversized)) {
    return deliver(plan, ready);
  }

  // One ordering value fills the entire page, so there is no whole value to
  // deliver and no way to resume inside it. Take the value complete instead.
  const group = await query(
    pool,
    plan,
    groupValueQuery(plan),
    GROUP_CEILING + 1,
    [oversized]
  );
  if (group.length > GROUP_CEILING) {
    throw new Error(
      `More than ${GROUP_CEILING} rows share one "${plan.columns[0].name}" value. Because the table has no primary key or unique constraint, rows sharing a value have to be delivered together, and a group this large cannot be. Add a key to the table, or order by a column whose values are finer.`
    );
  }
  return deliver(plan, group);
}

const pollingDescription = `Polls the table in the order of the column you choose and hands over every row it has not delivered yet, oldest first.

- Order by a **created** timestamp or **id** for new rows only; a **last-modified** timestamp or a **rowversion** column also catches edits.
- Best with an **identity column, primary key, or unique constraint**. Without one, all rows sharing an ordering value are delivered together as a single group.
- Rows where the order column is **empty** are skipped, and a row written **behind** the last value already delivered goes unnoticed — including one whose transaction commits after a later row's.`;

export const newOrUpdatedRowTrigger = createTrigger({
  auth: mssqlAuth,
  name: 'new-or-updated-row',
  displayName: 'New or Updated Row',
  description: 'Fires when a row is added to, or changed in, a table',
  aiMetadata: {
    description:
      'Fires when a row appears or changes in a selected SQL Server table, detected by polling and ordering on a chosen column. Order by a created timestamp or an identity id to catch only new rows, or by a last-modified timestamp or rowversion to catch edits as well. Each event carries one row.',
  },
  props: {
    description: Property.MarkDown({
      value: pollingDescription,
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
    max_rows: Property.Number({
      displayName: 'Maximum Rows Per Poll',
      description: `How many rows a single poll may hand over, up to ${MAX_ROWS_CEILING}. Each row starts its own flow run. Whatever is left over waits for the next poll rather than being dropped.`,
      required: false,
      defaultValue: DEFAULT_MAX_ROWS,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const pool = await mssqlConnect(context.auth);
    try {
      const plan = await buildPlan(pool, context.propsValue);
      // A preview of the most recent rows. Nothing is written to the store, so
      // testing cannot move a running trigger's position.
      const result = await pool
        .request()
        .input('limit', sql.Int, PREVIEW_ROWS)
        .query<Record<string, unknown>>(previewQuery(plan));
      // spread: recordset is an Array subclass carrying driver metadata
      return [...(result.recordset ?? [])];
    } finally {
      await pool.close();
    }
  },
  async onEnable(context) {
    const { store, auth, propsValue, isRepublish } = context;
    const pool = await mssqlConnect(auth);
    try {
      const plan = await buildPlan(pool, propsValue);
      // Republishing re-runs onEnable, and baselining there would skip
      // everything written since the trigger was switched on. Switching a
      // trigger on is the opposite case: it starts from the current head, so a
      // spell of being disabled does not arrive as a burst of runs. That is the
      // rule every polling trigger follows -- pollingHelper.onEnable keeps its
      // position under isRepublish and baselines otherwise.
      //
      // The position also has to be one this plan can actually read, so a
      // republish that changed the order column or the table re-baselines here
      // rather than leaving a cursor for run() to reject on the next poll.
      if (isRepublish) {
        const stored = reconcile(await store.get<Cursor>(CURSOR_KEY), plan);
        if (!isNil(stored)) {
          return;
        }
      }
      await store.put<Cursor>(CURSOR_KEY, await baseline(pool, plan));
    } finally {
      await pool.close();
    }
  },
  async onDisable() {
    // The position is left in the store rather than cleared, because a
    // republish disables and re-enables the trigger and onEnable needs it to
    // still be there. Switching the trigger back on by hand does not resume
    // from it: that path baselines at the head, so the disabled period does not
    // arrive as a burst of runs.
  },
  async run(context) {
    const { store, auth, propsValue } = context;
    const pool = await mssqlConnect(auth);
    try {
      const plan = await buildPlan(pool, propsValue);
      const cursor = reconcile(await store.get<Cursor>(CURSOR_KEY), plan);
      if (isNil(cursor)) {
        // No position this plan can use: either the trigger was never enabled,
        // or the table's shape changed under it. Re-baseline at the head rather
        // than replay the whole table as though every row were new.
        await store.put<Cursor>(CURSOR_KEY, await baseline(pool, plan));
        return [];
      }
      const limit = rowLimit(propsValue.max_rows);
      const page =
        plan.mode === 'keyset'
          ? await fetchKeysetPage(pool, plan, cursor, limit)
          : await fetchGroupPage(pool, plan, cursor, limit);
      if (page.next) {
        // The position has to be saved before the rows are handed back, so an
        // engine that dies in between loses them. Every polling trigger on the
        // platform shares that window; there is no hook after dispatch to close
        // it from in here.
        await store.put<Cursor>(CURSOR_KEY, page.next);
      }
      return page.payloads;
    } finally {
      await pool.close();
    }
  },
});
