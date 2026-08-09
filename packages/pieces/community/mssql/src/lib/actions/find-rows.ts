import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import { MssqlTable, mssqlConnect, quoteId, quoteTable } from '../common';
import { mssqlProps, warningMarkdown } from '../common/props';
import { findRowsActionOutputSchema } from '../output-schemas';

export default createAction({
  auth: mssqlAuth,
  name: 'find_rows',
  displayName: 'Find Rows',
  description: 'Reads rows from a table',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads rows from one SQL Server table, optionally filtered by a WHERE condition, restricted to chosen columns, sorted, and capped to a maximum number of rows. Use to look up or list records without writing a full query. The condition is inserted into the statement as written, so pass dynamic values through the Parameters map as named @placeholders instead of embedding them. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    markdown: warningMarkdown,
    table: mssqlProps.table(),
    columns: Property.Array({
      displayName: 'Columns',
      description: 'Columns to return. Leave empty to return every column.',
      required: false,
    }),
    condition: Property.ShortText({
      displayName: 'Condition',
      description:
        'The WHERE clause without the WHERE keyword, for example: balance >= @min AND is_active = 1. Leave empty to return every row.',
      required: false,
    }),
    parameters: Property.Object({
      displayName: 'Parameters',
      description:
        'Values for the @placeholders used in the condition. Enter the name without the @ prefix.',
      required: false,
    }),
    order_by: mssqlProps.column('Order By', 'Column to sort the rows by.', false),
    order_direction: Property.StaticDropdown({
      displayName: 'Order Direction',
      required: false,
      defaultValue: 'ASC',
      options: {
        options: [
          { label: 'Ascending', value: 'ASC' },
          { label: 'Descending', value: 'DESC' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Maximum number of rows to return. Leave empty for no limit.',
      required: false,
    }),
  },
  outputSchema: findRowsActionOutputSchema,
  async run(context) {
    const {
      table,
      columns,
      condition,
      parameters,
      order_by,
      order_direction,
      limit,
    } = context.propsValue;

    const selected = (columns as string[] | undefined) ?? [];
    const columnList =
      selected.length > 0 ? selected.map((c) => quoteId(c)).join(', ') : '*';

    let top = '';
    if (limit !== undefined && limit !== null && `${limit}`.trim() !== '') {
      const n = Number(limit);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`Limit must be a whole number of 1 or more, got: ${limit}`);
      }
      top = `TOP (${n}) `;
    }

    let query = `SELECT ${top}${columnList} FROM ${quoteTable(table as MssqlTable)}`;
    if (condition && condition.trim().length > 0) {
      query += ` WHERE ${condition}`;
    }
    if (order_by) {
      query += ` ORDER BY ${quoteId(order_by)} ${
        order_direction === 'DESC' ? 'DESC' : 'ASC'
      }`;
    }

    const pool = await mssqlConnect(context.auth);
    try {
      const request = pool.request();
      for (const [name, value] of Object.entries(parameters ?? {})) {
        request.input(name.replace(/^@/, ''), value ?? null);
      }
      const result = await request.query<Record<string, unknown>>(query);
      return result.recordset ?? [];
    } finally {
      await pool.close();
    }
  },
});
