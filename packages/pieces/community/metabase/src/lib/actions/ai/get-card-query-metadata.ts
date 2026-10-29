import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetCardQueryMetadataOutputSchema } from '../../output-schemas';

export const getCardQueryMetadataAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_card_query_metadata',
  outputSchema: metabaseGetCardQueryMetadataOutputSchema,
  displayName: 'Get Card Query Metadata',
  description: 'Get the tables, fields and databases a saved question uses.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the databases, tables and fields (with types) behind a question (card). Use it to learn column names and IDs before editing the query or building filters.',
    idempotent: true,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getCardQueryMetadata({
      auth,
      cardId: propsValue.cardId,
    });
  },
});
