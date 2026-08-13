import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import { mssqlCommon } from '../common';
import { cursorUtils } from '../common/cursor';
import { mssqlProps, warningMarkdown } from '../common/props';
import { findRowsActionOutputSchema } from '../output-schemas';

export const findRowsAction = createAction({
  auth: mssqlAuth,
  name: 'find_rows',
  displayName: 'Find Rows',
  description: 'Reads rows from a table',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads rows from one SQL Server table, optionally filtered by a WHERE condition, restricted to chosen columns, sorted, and capped to a maximum number of rows. Use to look up or list records without writing a full query. The condition is inserted into the statement as written, so pass dynamic values through the Parameters map as named @placeholders instead of embedding them. Not idempotent in general: the condition is raw T-SQL, so a statement that writes can be smuggled through it and repeating the call would repeat the write.',
    idempotent: false,
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
    order_by: mssqlProps.column({
      displayName: 'Order By',
      description: 'Column to sort the rows by.',
      required: false,
      sortableOnly: true,
    }),
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

    const selected = (columns ?? []).map(String);

    let top = '';
    if (!isNil(limit) && `${limit}`.trim() !== '') {
      const n = Number(limit);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`Limit must be a whole number of 1 or more, got: ${limit}`);
      }
      top = `TOP (${n}) `;
    }

    const pool = await mssqlCommon.connect({ auth: context.auth });
    try {
      const meta = await mssqlCommon.getTableMeta({ pool, table });
      const byName = new Map(meta.columns.map((c) => [c.name, c]));
      const projected =
        selected.length > 0
          ? selected.map((name) => {
              const column = byName.get(name);
              return column
                ? cursorUtils.exactColumn({ column })
                : mssqlCommon.quoteId(name);
            })
          : meta.columns.map((column) => cursorUtils.exactColumn({ column }));
      const columnList = projected.length > 0 ? projected.join(', ') : '*';

      let query = `SELECT ${top}${columnList} FROM ${mssqlCommon.quoteTable(
        table
      )}`;
      if (condition && condition.trim().length > 0) {
        query += ` WHERE ${condition}`;
      }
      if (order_by) {
        query += ` ORDER BY ${mssqlCommon.quoteTable(
          table
        )}.${mssqlCommon.quoteId(order_by)} ${
          order_direction === 'DESC' ? 'DESC' : 'ASC'
        }`;
      }

      const request = mssqlCommon.bindParameters({
        request: pool.request(),
        parameters,
      });
      const result = await request.query<Record<string, unknown>>(query);
      return result.recordset ?? [];
    } finally {
      await pool.close();
    }
  },
});
