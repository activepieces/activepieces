import { createAction, Property } from '@activepieces/pieces-framework';
import { redshiftAuth } from '../auth';
import { redshiftClient } from '../common/client';
import { redshiftProps } from '../common/props';
import { redshiftUtils } from '../common/utils';
import { deleteRowsOutputSchema } from '../output-schemas';

export const deleteRows = createAction({
  auth: redshiftAuth,
  name: 'delete_rows',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Rows',
  description: 'Deletes every row where a column equals a value.',
  audience: 'both',
  outputSchema: deleteRowsOutputSchema,
  aiMetadata: {
    description: 'Permanently deletes every row of an Amazon Redshift table whose search column equals the search value. Returns the number of rows deleted. Use Run Query for more complex conditions. Not idempotent in result: a repeat deletes nothing and returns 0.',
    idempotent: false,
  },
  props: {
    table: redshiftProps.table({ required: true }),
    search_column: redshiftProps.column({ required: true, displayName: 'Search Column', description: 'The column to match rows on.' }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'Rows whose search column equals this value are deleted.',
      required: true,
    }),
  },
  async run(context) {
    const { table, search_column, search_value } = context.propsValue;
    const sql = `DELETE FROM ${redshiftUtils.qualifiedName({ table })} WHERE ${redshiftUtils.quoteIdentifier({ name: search_column })} = $1`;
    const { rowCount } = await redshiftClient.runSql({ auth: context.auth, server: context.server, sql, params: [search_value] });
    return { rowCount };
  },
});
