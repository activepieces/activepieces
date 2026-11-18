import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropGetCollectionCountsOutputSchema } from '../../../output-schemas';

export const raindropGetCollectionCountsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_get_collection_counts',
  outputSchema: raindropGetCollectionCountsOutputSchema,
  displayName: 'Get Collection Counts',
  description: 'Gets bookmark counts for the system collections (All, Unsorted, Trash).',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns the bookmark count of each system collection (0 = all bookmarks, -1 = Unsorted, -99 = Trash) plus the number of duplicate and broken bookmarks. For a user collection's count use Get Collection.",
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await raindropClient.request<RaindropGetCollectionCountsResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/user/stats',
    });
  },
});

type RaindropGetCollectionCountsResponse = {
  result: boolean;
  items: { _id: number; count: number }[];
  meta: Record<string, unknown>;
};
