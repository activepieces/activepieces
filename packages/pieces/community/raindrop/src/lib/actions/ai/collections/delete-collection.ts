import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropEmptyTrashOutputSchema } from '../../../output-schemas';

export const raindropDeleteCollectionAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_delete_collection',
  outputSchema: raindropEmptyTrashOutputSchema,
  displayName: 'Delete Collection',
  description: 'Deletes a collection and all its sub-collections.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one collection and all of its nested collections; their bookmarks move to Trash. Get the collection ID from List Collections or List Child Collections. Use Delete Collections to remove several at once.',
    idempotent: false,
  },
  props: {
    collectionId: raindropAiProps.collectionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropDeleteCollectionResponse>({
      auth,
      method: HttpMethod.DELETE,
      path: `/collection/${encodeURIComponent(propsValue.collectionId)}`,
    });
  },
});

type RaindropDeleteCollectionResponse = {
  result: boolean;
};
