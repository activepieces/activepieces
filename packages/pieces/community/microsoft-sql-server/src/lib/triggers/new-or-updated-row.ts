import {
  Property,
  TriggerStrategy,
  createTrigger,
  isNil,
} from '@activepieces/pieces-framework';
import sql from 'mssql';
import { mssqlAuth } from '../auth';
import { MssqlTable, mssqlCommon } from '../common';
import { Cursor, OrderDirection, Plan, cursorUtils } from '../common/cursor';
import { mssqlProps } from '../common/props';
import { newOrUpdatedRowTriggerOutputSchema } from '../output-schemas';

const CURSOR_KEY = 'cursor';
const MAX_ROWS_PER_POLL = 200;
const PREVIEW_ROWS = 5;
const GROUP_CEILING = 2000;

const EMPTY: Page = { payloads: [], next: null };

const pollingDescription = `Polls the table in the order of the column you choose and hands over every row it has not delivered yet, oldest first.

- Order by a **created** timestamp or **id** for new rows only; a **last-modified** timestamp or a **rowversion** column also catches edits.
- Best with an **identity column, primary key, or unique constraint**. Without one, all rows sharing an ordering value are delivered together as a single group, and a row that arrives later carrying a value that group already delivered is **not** picked up — so prefer a keyed table when a bulk load or same-second writes can put several rows on one value.
- Rows where the order column is **empty** are skipped, and a row written **behind** the last value already delivered goes unnoticed — including one whose transaction commits after a later row's.`;

async function buildPlan({
  pool,
  propsValue,
}: {
  pool: sql.ConnectionPool;
  propsValue: Props;
}): Promise<Plan> {
  return cursorUtils.planCursor({
    meta: await mssqlCommon.getTableMeta({ pool, table: propsValue.table }),
    propsValue,
  });
}

async function baseline({
  pool,
  plan,
}: {
  pool: sql.ConnectionPool;
  plan: Plan;
}): Promise<Cursor> {
  const result = await pool
    .request()
    .query<Record<string, unknown>>(cursorUtils.baselineQuery(plan));
  const row = (result.recordset ?? [])[0];
  return cursorUtils.newCursor({
    plan,
    position: isNil(row) ? null : cursorUtils.positionOf({ plan, row }),
  });
}

function deliver({ plan, rows }: { plan: Plan; rows: Row[] }): Page {
  if (rows.length === 0) return EMPTY;
  return {
    payloads: rows.map((row) => cursorUtils.stripPosition({ plan, row })),
    next: cursorUtils.newCursor({
      plan,
      position: cursorUtils.positionOf({ plan, row: rows[rows.length - 1] }),
    }),
  };
}

async function query({
  pool,
  plan,
  text,
  limit,
  position,
}: {
  pool: sql.ConnectionPool;
  plan: Plan;
  text: string;
  limit: number;
  position: string[] | null;
}): Promise<Row[]> {
  const request = pool.request();
  request.input('limit', sql.Int, limit);
  if (position) {
    cursorUtils.bindCursorValues({
      request,
      columns: plan.columns,
      values: position,
    });
  }
  return (await request.query<Row>(text)).recordset ?? [];
}

async function fetchKeysetPage({
  pool,
  plan,
  cursor,
  limit,
}: {
  pool: sql.ConnectionPool;
  plan: Plan;
  cursor: Cursor;
  limit: number;
}): Promise<Page> {
  return deliver({
    plan,
    rows: await query({
      pool,
      plan,
      text: cursorUtils.keysetPageQuery({ plan, position: cursor.k }),
      limit,
      position: cursor.k,
    }),
  });
}

async function fetchGroupPage({
  pool,
  plan,
  cursor,
  limit,
}: {
  pool: sql.ConnectionPool;
  plan: Plan;
  cursor: Cursor;
  limit: number;
}): Promise<Page> {
  const rows = await query({
    pool,
    plan,
    text: cursorUtils.groupPageQuery({ plan, position: cursor.k }),
    limit: limit + 1,
    position: cursor.k,
  });
  const { ready, oversized } = cursorUtils.completeGroups({
    plan,
    rows,
    limit,
  });
  if (isNil(oversized)) {
    return deliver({ plan, rows: ready });
  }

  const group = await query({
    pool,
    plan,
    text: cursorUtils.groupValueQuery(plan),
    limit: GROUP_CEILING + 1,
    position: [oversized],
  });
  if (group.length > GROUP_CEILING) {
    throw new Error(
      `More than ${GROUP_CEILING} rows share one "${plan.columns[0].name}" value. Because the table has no primary key or unique constraint, rows sharing a value have to be delivered together, and a group this large cannot be. Add a key to the table, or order by a column whose values are finer.`
    );
  }
  return deliver({ plan, rows: group });
}

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
    order_by: mssqlProps.column({
      displayName: 'Column to order by',
      description:
        'Use a created timestamp, a last-modified timestamp, or an auto-incrementing id.',
      required: true,
      sortableOnly: true,
    }),
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
  outputSchema: newOrUpdatedRowTriggerOutputSchema,
  type: TriggerStrategy.POLLING,
  async test(context) {
    const pool = await mssqlCommon.connect({ auth: context.auth });
    try {
      const plan = await buildPlan({ pool, propsValue: context.propsValue });
      const result = await pool
        .request()
        .input('limit', sql.Int, PREVIEW_ROWS)
        .query<Record<string, unknown>>(cursorUtils.previewQuery(plan));
      return [...(result.recordset ?? [])];
    } finally {
      await pool.close();
    }
  },
  async onEnable(context) {
    const { store, auth, propsValue, isRepublish } = context;
    const pool = await mssqlCommon.connect({ auth });
    try {
      const plan = await buildPlan({ pool, propsValue });
      if (isRepublish) {
        const stored = cursorUtils.reconcile({
          stored: await store.get<Cursor>(CURSOR_KEY),
          plan,
        });
        if (!isNil(stored)) {
          return;
        }
      }
      await store.put<Cursor>(CURSOR_KEY, await baseline({ pool, plan }));
    } finally {
      await pool.close();
    }
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const { store, auth, propsValue } = context;
    const pool = await mssqlCommon.connect({ auth });
    try {
      const plan = await buildPlan({ pool, propsValue });
      const cursor = cursorUtils.reconcile({
        stored: await store.get<Cursor>(CURSOR_KEY),
        plan,
      });
      if (isNil(cursor)) {
        await store.put<Cursor>(CURSOR_KEY, await baseline({ pool, plan }));
        return [];
      }
      const limit = MAX_ROWS_PER_POLL;
      const page =
        plan.mode === 'keyset'
          ? await fetchKeysetPage({ pool, plan, cursor, limit })
          : await fetchGroupPage({ pool, plan, cursor, limit });
      if (page.next) {
        await store.put<Cursor>(CURSOR_KEY, page.next);
      }
      return page.payloads;
    } finally {
      await pool.close();
    }
  },
});

type Props = {
  table: MssqlTable;
  order_by: string;
  order_direction: OrderDirection | undefined;
};

type Page = { payloads: unknown[]; next: Cursor | null };

type Row = Record<string, unknown>;
