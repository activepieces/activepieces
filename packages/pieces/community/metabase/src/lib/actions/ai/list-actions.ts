import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListActionsOutputSchema } from '../../output-schemas';

export const listActionsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_actions',
  outputSchema: metabaseListActionsOutputSchema,
  displayName: 'List Actions',
  description: 'List Metabase actions.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Metabase actions (saved write operations on a model, run with Execute Action), optionally for one model.',
    idempotent: true,
  },
  props: {
    modelId: metabaseAiProps.cardId({
      required: false,
      displayName: 'Model ID',
      description:
        'Only actions of this model (a card of type model), from List Cards. Empty = all.',
    }),
  },
  async run({ auth, propsValue }) {
    const actions = await metabaseApi.listActions({
      auth,
      modelId: propsValue.modelId,
    });
    return { actions, count: actions.length };
  },
});
