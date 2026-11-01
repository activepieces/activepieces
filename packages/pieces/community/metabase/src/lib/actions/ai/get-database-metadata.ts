import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetDatabaseMetadataOutputSchema } from '../../output-schemas';

export const getDatabaseMetadataAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_database_metadata',
  outputSchema: metabaseGetDatabaseMetadataOutputSchema,
  displayName: 'Get Database Metadata',
  description: 'Get every table and field of a database.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a database with all of its tables and their fields (names, types, ids) in one call. Large for big warehouses; use List Schema Tables or Get Table Metadata to narrow down.',
    idempotent: true,
  },
  props: {
    databaseId: metabaseAiProps.databaseId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getDatabaseMetadata({
      auth,
      databaseId: propsValue.databaseId,
    });
  },
});
