import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropDeleteCollectionsOutputSchema } from '../../../output-schemas';

export const raindropDeleteCollectionsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_delete_collections',
  outputSchema: raindropDeleteCollectionsOutputSchema,
  displayName: 'Delete Collections',
  description: 'Deletes several collections at once.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes several collections in one call; their bookmarks move to Trash. Nested collections are not removed with their parent here, so list their IDs too (from List Child Collections). Use Delete Collection for a single collection with all its descendants.',
    idempotent: false,
  },
  props: {
    ids: Property.Array({
      displayName: 'Collection IDs',
      description:
        'IDs of the collections to delete, from List Collections or List Child Collections, e.g. ["123", "456"].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = raindropUtils.toStringList({ value: propsValue.ids });
    if (ids.length === 0 || !ids.every((id) => id !== '')) {
      throw new Error('Collection IDs must be a non-empty list of IDs.');
    }
    return await raindropClient.request<RaindropDeleteCollectionsResponse>({
      auth,
      method: HttpMethod.DELETE,
      path: '/collections',
      body: { ids },
    });
  },
});

type RaindropDeleteCollectionsResponse = {
  result: boolean;
};
