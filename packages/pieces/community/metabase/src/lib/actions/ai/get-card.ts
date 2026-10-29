import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetCardOutputSchema } from '../../output-schemas';

export const getCardAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_card',
  outputSchema: metabaseGetCardOutputSchema,
  displayName: 'Get Card',
  description: 'Get a saved question, model or metric by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one saved question (card), model or metric with its query definition, visualization, collection and filter parameters. Use Run Card Query to get its result rows.',
    idempotent: true,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getCard({ auth, cardId: propsValue.cardId });
  },
});
