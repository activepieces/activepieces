import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import { mssqlCommon } from '../common';
import { cursorUtils } from '../common/cursor';
import { mssqlProps } from '../common/props';
import { writeRowsActionOutputSchema } from '../output-schemas';

export const deleteRowsAction = createAction({
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
    search_column: mssqlProps.column({
      displayName: 'Search Column',
      description: 'Rows are deleted where this column equals the value below.',
      required: true,
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value the search column must equal.',
      required: true,
    }),
  },
  outputSchema: writeRowsActionOutputSchema,
  async run(context) {
    const { table, search_column, search_value } = context.propsValue;
    const target = mssqlCommon.quoteTable(table);
    const where = `WHERE ${mssqlCommon.quoteId(search_column)} = @search`;

    const pool = await mssqlCommon.connect({ auth: context.auth });
    try {
      const bind = () => pool.request().input('search', search_value);

      const meta = await mssqlCommon.getTableMeta({ pool, table });
      const output = cursorUtils.exactProjection({
        columns: meta.columns,
        prefix: 'DELETED',
      });

      return await mssqlCommon.writeReturningRows({
        bind,
        withOutput: `DELETE FROM ${target} OUTPUT ${output} ${where}`,
        withoutOutput: `DELETE FROM ${target} ${where}`,
      });
    } finally {
      await pool.close();
    }
  },
});
