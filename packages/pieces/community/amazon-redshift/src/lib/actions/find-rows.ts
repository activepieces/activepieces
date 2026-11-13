import { createAction, Property } from '@activepieces/pieces-framework';
import { redshiftAuth } from '../auth';
import { redshiftClient } from '../common/client';
import { redshiftProps } from '../common/props';
import { redshiftUtils } from '../common/utils';
import { findRowsOutputSchema } from '../output-schemas';

export const findRows = createAction({
  auth: redshiftAuth,
  name: 'find_rows',
  classification: 'SEARCH',
  displayName: 'Find Rows',
  description: 'Finds rows where a column equals a value.',
  audience: 'both',
  outputSchema: findRowsOutputSchema,
  aiMetadata: {
    description: 'Reads rows from an Amazon Redshift table, optionally only those whose search column equals the search value, up to a row limit (100 by default). Use Run Query for joins, ranges or aggregates. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    table: redshiftProps.table({ required: true }),
    search_column: redshiftProps.column({ required: false, displayName: 'Search Column', description: 'Leave empty to read rows without a filter.' }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'Rows whose search column equals this value are returned.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The most rows to return.',
      defaultValue: 100,
      required: true,
    }),
  },
  async run(context) {
    const { table, search_column, search_value, limit } = context.propsValue;
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('Limit must be a positive whole number.');
    }
    const filtered = Boolean(search_column);
    if (filtered && (search_value === undefined || search_value === '')) {
      throw new Error('Enter a Search Value, or clear the Search Column.');
    }
    const where = search_column ? ` WHERE ${redshiftUtils.quoteIdentifier({ name: search_column })} = $1` : '';
    const sql = `SELECT * FROM ${redshiftUtils.qualifiedName({ table })}${where} LIMIT ${limit}`;
    return await redshiftClient.runSql({ auth: context.auth, server: context.server, sql, params: filtered ? [search_value] : [] });
  },
});
