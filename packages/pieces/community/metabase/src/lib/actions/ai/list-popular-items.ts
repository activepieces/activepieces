import { createAction } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListPopularItemsOutputSchema } from '../../output-schemas';

export const listPopularItemsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_popular_items',
  outputSchema: metabaseListPopularItemsOutputSchema,
  displayName: 'List Popular Items',
  description: 'List the most-viewed items.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the most popular questions, dashboards and collections in the instance by recent views.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await metabaseApi.listPopularItems({ auth });
  },
});
