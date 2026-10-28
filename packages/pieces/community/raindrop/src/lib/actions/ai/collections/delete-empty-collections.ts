import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropDeleteEmptyCollectionsOutputSchema } from '../../../output-schemas';

export const raindropDeleteEmptyCollectionsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_delete_empty_collections',
  outputSchema: raindropDeleteEmptyCollectionsOutputSchema,
  displayName: 'Delete Empty Collections',
  description: 'Deletes every collection that has no bookmarks.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes every collection that holds no bookmarks and returns how many were removed. Repeating it removes nothing more. Use Delete Collection or Delete Collections to remove specific collections.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await raindropClient.request<RaindropDeleteEmptyCollectionsResponse>({
      auth,
      method: HttpMethod.PUT,
      path: '/collections/clean',
    });
  },
});

type RaindropDeleteEmptyCollectionsResponse = {
  result: boolean;
  count: number;
};
