import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropEmptyTrashOutputSchema } from '../../../output-schemas';

export const raindropUnshareCollectionAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_unshare_collection',
  outputSchema: raindropEmptyTrashOutputSchema,
  displayName: 'Unshare Collection',
  description: 'Stops sharing a collection you own, or leaves a collection shared with you.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'For a collection you own, unshares it and removes every collaborator; for a collection shared with you, removes you from it. Collection ID comes from List Collections. To remove a single person use Remove Collaborator.',
    idempotent: false,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: true,
      description: 'ID of the shared collection, from List Collections.',
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropUnshareCollectionResponse>({
      auth,
      method: HttpMethod.DELETE,
      path: `/collection/${encodeURIComponent(propsValue.collectionId)}/sharing`,
    });
  },
});

type RaindropUnshareCollectionResponse = {
  result: boolean;
};
