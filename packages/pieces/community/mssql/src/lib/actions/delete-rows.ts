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

export default createAction({
  auth: mssqlAuth,
  name: 'delete_rows',
  displayName: 'Delete Rows',
  description: 'Deletes every row whose search column matches a value',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes every row in a SQL Server table whose search column equals a given value, and returns the rows that were removed. Use to delete records matched on a single column; for anything more complex use Run Query. Idempotent: once the matching rows are gone, re-running deletes nothing further.',
    idempotent: true,
  },
  props: {
    table: mssqlProps.table(),
    search_column: mssqlProps.column(
      'Search Column',
      'Rows are deleted where this column equals the value below.'
    ),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value the search column must equal.',
      required: true,
    }),
  },
  async run(context) {
    const { table, search_column, search_value } = context.propsValue;
    const target = quoteTable(table as MssqlTable);
    const where = `WHERE ${quoteId(search_column)} = @search`;

    const pool = await mssqlConnect(context.auth);
    try {
      const bind = () => pool.request().input('search', search_value);

      let rows: Record<string, unknown>[] = [];
      let affected: number[] = [];
      try {
        const result = await bind().query<Record<string, unknown>>(
          `DELETE FROM ${target} OUTPUT DELETED.* ${where}`
        );
        rows = result.recordset ?? [];
        affected = result.rowsAffected ?? [];
      } catch (e) {
        if (!isOutputBlockedByTrigger(e)) throw e;
        const result = await bind().query<Record<string, unknown>>(
          `DELETE FROM ${target} ${where}`
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
