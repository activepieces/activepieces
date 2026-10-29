import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const rescanDatabaseFieldValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_rescan_database_field_values',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Rescan Database Field Values',
  description: 'Start a rescan of filter values for a database.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a background rescan of the distinct values Metabase caches for filter dropdowns across a database; returns before it finishes. Needs an admin key.',
    idempotent: true,
  },
  props: {
    databaseId: metabaseAiProps.databaseId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.rescanDatabaseFieldValues({
      auth,
      databaseId: propsValue.databaseId,
    });
  },
});
