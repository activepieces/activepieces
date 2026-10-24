import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseConvertQueryToNativeOutputSchema } from '../../output-schemas';

export const convertQueryToNativeAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_convert_query_to_native',
  outputSchema: metabaseConvertQueryToNativeOutputSchema,
  displayName: 'Convert Query to Native',
  description: 'Get the SQL that a query-builder query compiles to.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the native SQL (or database query) that a query-builder (MBQL) query compiles to, without running it.',
    idempotent: true,
  },
  props: {
    datasetQuery: Property.Json({
      displayName: 'Dataset Query',
      description:
        'An MBQL query, e.g. {"database": 1, "type": "query", "query": {"source-table": 2, "limit": 10}}. Get it from a card\'s `dataset_query` (Get Card).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.convertQueryToNative({
      auth,
      datasetQuery: propsValue.datasetQuery,
    });
  },
});
