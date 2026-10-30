import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const discardDatabaseFieldValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_discard_database_field_values',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Discard Database Field Values',
  description: 'Discard cached filter values for a database.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Deletes the distinct values Metabase cached for filter dropdowns across a database; they are rebuilt on the next scan. Needs an admin key.',
    idempotent: true,
  },
  props: {
    databaseId: metabaseAiProps.databaseId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.discardDatabaseFieldValues({
      auth,
      databaseId: propsValue.databaseId,
    });
  },
});
