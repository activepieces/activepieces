import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import { mssqlCommon } from '../common';
import { cursorUtils } from '../common/cursor';
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
    search_column: mssqlProps.column({
      displayName: 'Search Column',
      description: 'Rows are updated where this column equals the value below.',
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
    const { table, values, search_column, search_value } = context.propsValue;
    const entries = Object.entries(values ?? {});
    if (entries.length === 0) {
      throw new Error('Provide at least one column and value to update.');
    }

    const target = mssqlCommon.quoteTable(table);
    const assignments = entries
      .map(([column], i) => `${mssqlCommon.quoteId(column)} = @p${i}`)
      .join(', ');
    const where = `WHERE ${mssqlCommon.quoteId(search_column)} = @search`;

    const pool = await mssqlCommon.connect({ auth: context.auth });
    try {
      const bind = () => {
        const request = pool.request();
        entries.forEach(([, value], i) => request.input(`p${i}`, value ?? null));
        request.input('search', search_value);
        return request;
      };

      const meta = await mssqlCommon.getTableMeta({ pool, table });
      const output = cursorUtils.exactProjection({
        columns: meta.columns,
        prefix: 'INSERTED',
      });

      return await mssqlCommon.writeReturningRows({
        bind,
        withOutput: `UPDATE ${target} SET ${assignments} OUTPUT ${output} ${where}`,
        withoutOutput: `UPDATE ${target} SET ${assignments} ${where}`,
      });
    } finally {
      await pool.close();
    }
  },
});
