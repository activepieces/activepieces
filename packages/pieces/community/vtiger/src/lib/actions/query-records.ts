import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../auth';
import { queryRecordsSchema } from '../output-schemas';
import { vtwsLogin, vtwsQuery } from '../vtws';

export const queryRecords = createAction({
  name: 'query_records',
  classification: 'SEARCH',
  auth: vtigerAuth,
  displayName: 'Query Records',
  description: 'Query records by SQL statement.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a Vtiger VTQL read query (e.g. SELECT * FROM Contacts WHERE lastname = \'Smith\' LIMIT 0, 100;) and returns the matching rows or aggregates such as count(*). Choose this for custom conditions or columns that Search Module Records cannot express. Add LIMIT offset, count to page through large result sets. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: queryRecordsSchema,
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description:
        'Enter the query statement, e.g. SELECT count(*) FROM Contacts; Add LIMIT offset, count to page through large results.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const query = propsValue.query.trim();
    if (query === '') {
      throw new Error('Query must not be empty');
    }
    const session = await vtwsLogin(auth.props);
    return vtwsQuery<Record<string, unknown>>({ creds: auth.props, session, query });
  },
});
