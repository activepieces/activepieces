import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCopyCardOutputSchema } from '../../output-schemas';

export const copyCardAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_copy_card',
  outputSchema: metabaseCopyCardOutputSchema,
  displayName: 'Copy Card',
  description: 'Duplicate a saved question.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a copy of a question (card) in the same collection and returns the new card. Each call creates another copy.',
    idempotent: false,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.copyCard({ auth, cardId: propsValue.cardId });
  },
});
