import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListCardsOutputSchema } from '../../output-schemas';

export const listCardsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_cards',
  outputSchema: metabaseListCardsOutputSchema,
  displayName: 'List Cards',
  description: 'List saved questions, models and metrics.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every saved question (card), model and metric the connection can see, optionally narrowed by a filter. Metabase returns the whole list in one call, so prefer Search to find a card by name in a large instance.',
    idempotent: true,
  },
  props: {
    filter: Property.StaticDropdown({
      displayName: 'Filter',
      description: 'Which cards to return. Empty = all non-archived cards.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Created by me', value: 'mine' },
          { label: 'Bookmarked', value: 'bookmarked' },
          { label: 'Archived', value: 'archived' },
          { label: 'Using a model', value: 'using_model' },
        ],
      },
    }),
    modelId: Property.Number({
      displayName: 'Model ID',
      description:
        'With filter "Using a model": the model card ID whose dependent questions to return.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const cards = await metabaseApi.listCards({
      auth,
      filter: propsValue.filter,
      modelId: propsValue.modelId,
    });
    return { cards, count: cards.length };
  },
});
