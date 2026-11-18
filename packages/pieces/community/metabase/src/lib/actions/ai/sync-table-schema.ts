import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const syncTableSchemaAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_sync_table_schema',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Sync Table Schema',
  description: 'Start a schema sync for one table.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a background sync of one table so Metabase picks up new or changed columns; returns before it finishes. Needs an admin key.',
    idempotent: true,
  },
  props: {
    tableId: metabaseAiProps.tableId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.syncTableSchema({
      auth,
      tableId: propsValue.tableId,
    });
  },
});
