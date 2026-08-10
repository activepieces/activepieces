import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import {
  MssqlTable,
  isOutputBlockedByTrigger,
  mssqlConnect,
  quoteId,
  quoteTable,
} from '../common';
import { mssqlProps } from '../common/props';
import { writeRowsActionOutputSchema } from '../output-schemas';

export const updateRowsAction = createAction({
  auth: mssqlAuth,
  name: 'update_rows',
  displayName: 'Update Rows',
  description: 'Updates every row whose search column matches a value',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates every row in a SQL Server table whose search column equals a given value, setting the supplied column-to-value pairs, and returns the updated rows. Use to modify existing records matched on a single column; for anything more complex use Run Query. Idempotent: re-running with the same input writes the same values and changes nothing further.',
    idempotent: true,
  },
  props: {
    table: mssqlProps.table(),
    values: Property.Object({
      displayName: 'Values',
      description: 'Column name to new value.',
      required: true,
    }),
    search_column: mssqlProps.column(
      'Search Column',
      'Rows are updated where this column equals the value below.'
    ),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value the search column must equal.',
      required: true,
    }),
  },
  outputSchema: writeRowsActionOutputSchema,
  async run(context) {
    const { table, values, search_column, search_value } = context.propsValue;
    const entries = Object.entries(values ?? {});
    if (entries.length === 0) {
      throw new Error('Provide at least one column and value to update.');
    }

    const target = quoteTable(table as MssqlTable);
    const assignments = entries
      .map(([column], i) => `${quoteId(column)} = @p${i}`)
      .join(', ');
    const where = `WHERE ${quoteId(search_column)} = @search`;

    const pool = await mssqlConnect(context.auth);
    try {
      const bind = () => {
        const request = pool.request();
        entries.forEach(([, value], i) => request.input(`p${i}`, value ?? null));
        request.input('search', search_value);
        return request;
      };

      let rows: Record<string, unknown>[] = [];
      let affected: number[] = [];
      try {
        const result = await bind().query<Record<string, unknown>>(
          `UPDATE ${target} SET ${assignments} OUTPUT INSERTED.* ${where}`
        );
        rows = result.recordset ?? [];
        affected = result.rowsAffected ?? [];
      } catch (e) {
        if (!isOutputBlockedByTrigger(e)) throw e;
        const result = await bind().query<Record<string, unknown>>(
          `UPDATE ${target} SET ${assignments} ${where}`
        );
        affected = result.rowsAffected ?? [];
      }

      return {
        rows,
        rows_affected: affected.reduce((a, b) => a + b, 0),
      };
    } finally {
      await pool.close();
    }
  },
});
