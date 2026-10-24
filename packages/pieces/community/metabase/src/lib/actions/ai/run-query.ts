import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseRunQueryOutputSchema } from '../../output-schemas';

export const runQueryAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_run_query',
  outputSchema: metabaseRunQueryOutputSchema,
  displayName: 'Run Query',
  description: 'Run an ad-hoc SQL or query-builder query.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Runs a query without saving it and returns rows and columns. For SQL use a native query; get database ids from List Databases. SQL can write to the database, and repeating a call repeats the write. Results are capped by Metabase (2,000 rows by default).',
    idempotent: false,
  },
  props: {
    datasetQuery: Property.Json({
      displayName: 'Dataset Query',
      description:
        'SQL example: {"database": 1, "type": "native", "native": {"query": "SELECT * FROM orders LIMIT 10"}}. MBQL example: {"database": 1, "type": "query", "query": {"source-table": 2, "limit": 10}}.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.runQuery({
      auth,
      datasetQuery: propsValue.datasetQuery,
    });
  },
});
