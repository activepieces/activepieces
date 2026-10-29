import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropDeleteCollectionsOutputSchema } from '../../../output-schemas';

export const raindropMergeCollectionsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_merge_collections',
  outputSchema: raindropDeleteCollectionsOutputSchema,
  displayName: 'Merge Collections',
  description: 'Merges several collections into one.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Moves the bookmarks of the listed collections into a target collection and removes the merged collections. Get all IDs from List Collections or List Child Collections. Cannot be undone.',
    idempotent: false,
  },
  props: {
    to: raindropAiProps.collectionId({
      required: true,
      displayName: 'Target Collection ID',
      description:
        'ID of the collection to merge into, from List Collections or List Child Collections.',
    }),
    ids: Property.Array({
      displayName: 'Collection IDs',
      description: 'IDs of the collections to merge into the target, e.g. ["123", "456"].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = raindropUtils.toStringList({ value: propsValue.ids });
    if (ids.length === 0 || !ids.every((id) => id !== '')) {
      throw new Error('Collection IDs must be a non-empty list of IDs.');
    }
    return await raindropClient.request<RaindropMergeCollectionsResponse>({
      auth,
      method: HttpMethod.PUT,
      path: '/collections/merge',
      body: { to: propsValue.to, ids },
    });
  },
});

type RaindropMergeCollectionsResponse = {
  result: boolean;
};
