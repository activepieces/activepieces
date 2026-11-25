import { createAction, Property } from '@activepieces/pieces-framework';
import { redshiftAuth } from '../auth';
import { redshiftClient } from '../common/client';
import { redshiftProps } from '../common/props';
import { redshiftUtils } from '../common/utils';
import { updateRowsOutputSchema } from '../output-schemas';

export const updateRows = createAction({
  auth: redshiftAuth,
  name: 'update_rows',
  classification: 'WRITE',
  displayName: 'Update Rows',
  description: 'Updates every row where a column equals a value.',
  audience: 'both',
  outputSchema: updateRowsOutputSchema,
  aiMetadata: {
    description: 'Sets new values on every row of an Amazon Redshift table whose search column equals the search value; only the filled fields change. Returns the number of rows updated. Use Run Query for more complex conditions. Idempotent: repeating the call sets the same values again.',
    idempotent: true,
  },
  props: {
    table: redshiftProps.table({ required: true }),
    search_column: redshiftProps.column({ required: true, displayName: 'Search Column', description: 'The column to match rows on.' }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'Rows whose search column equals this value are updated.',
      required: true,
    }),
    values: redshiftProps.values({ required: true }),
  },
  async run(context) {
    const { table, search_column, search_value, values } = context.propsValue;
    const changes = Object.entries(redshiftUtils.filledFields({ values }));
    if (changes.length === 0) {
      throw new Error('Fill at least one field in New Values.');
    }
    const assignments = changes.map(([name], index) => `${redshiftUtils.quoteIdentifier({ name })} = $${index + 1}`).join(', ');
    const sql = `UPDATE ${redshiftUtils.qualifiedName({ table })} SET ${assignments} WHERE ${redshiftUtils.quoteIdentifier({ name: search_column })} = $${changes.length + 1}`;
    const { rowCount } = await redshiftClient.runSql({
      auth: context.auth,
      server: context.server,
      sql,
      params: [...changes.map(([, value]) => value), search_value],
    });
    return { rowCount };
  },
});
