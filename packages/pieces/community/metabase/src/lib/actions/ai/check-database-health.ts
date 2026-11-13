import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const checkDatabaseHealthAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_check_database_health',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Check Database Health',
  description: 'Check that Metabase can connect to a database.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Tests Metabase's connection to a database and returns its status; an unreachable database returns an error status.",
    idempotent: true,
  },
  props: {
    databaseId: metabaseAiProps.databaseId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.checkDatabaseHealth({
      auth,
      databaseId: propsValue.databaseId,
    });
  },
});
