import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const syncDatabaseSchemaAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_sync_database_schema',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Sync Database Schema',
  description: 'Start a schema sync for a database.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a background sync so Metabase picks up new or changed tables and columns; returns immediately, before the sync finishes. Needs an admin key.',
    idempotent: true,
  },
  props: {
    databaseId: metabaseAiProps.databaseId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.syncDatabaseSchema({
      auth,
      databaseId: propsValue.databaseId,
    });
  },
});
