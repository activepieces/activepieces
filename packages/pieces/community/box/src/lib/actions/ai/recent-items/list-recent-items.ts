import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListRecentItemsOutputSchema } from '../../../output-schemas';

export const listRecentItemsAction = createAction({
  auth: boxAuth,
  name: 'box_list_recent_items',
  outputSchema: boxListRecentItemsOutputSchema,
  displayName: 'List Recent Items',
  description: 'Lists the items the user recently accessed in Box.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the items the user opened, previewed, commented on, edited or uploaded in the last 90 days (up to 1000), newest first, with each item\'s ID and the interaction type. Page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/recent_items',
      query: {
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        marker: propsValue.marker,
        fields: propsValue.fields,
      },
    });
  },
});
