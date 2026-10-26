import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListCardDashboardsOutputSchema } from '../../output-schemas';

export const listCardDashboardsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_card_dashboards',
  outputSchema: metabaseListCardDashboardsOutputSchema,
  displayName: 'List Card Dashboards',
  description: 'List the dashboards that use a saved question.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the dashboards a question (card) appears on. Use before changing or deleting a card to see what it affects.',
    idempotent: true,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const dashboards = await metabaseApi.listCardDashboards({
      auth,
      cardId: propsValue.cardId,
    });
    return { dashboards, count: dashboards.length };
  },
});
