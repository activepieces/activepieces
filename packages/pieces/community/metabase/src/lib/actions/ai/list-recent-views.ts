import { createAction } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListRecentViewsOutputSchema } from '../../output-schemas';

export const listRecentViewsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_recent_views',
  outputSchema: metabaseListRecentViewsOutputSchema,
  displayName: 'List Recent Views',
  description: 'List items the connection user viewed recently.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the items the connection's user viewed recently, newest first.",
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await metabaseApi.listRecentViews({ auth, context: 'views' });
  },
});
