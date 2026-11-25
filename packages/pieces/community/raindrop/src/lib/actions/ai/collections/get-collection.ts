import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropGetCollectionOutputSchema } from '../../../output-schemas';

export const raindropGetCollectionAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_get_collection',
  outputSchema: raindropGetCollectionOutputSchema,
  displayName: 'Get Collection',
  description: 'Gets a single collection by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one collection by ID with its title, bookmark count, cover, view, visibility, access level and parent. Get the ID from List Collections or List Child Collections.',
    idempotent: true,
  },
  props: {
    collectionId: raindropAiProps.collectionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropGetCollectionResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/collection/${encodeURIComponent(propsValue.collectionId)}`,
    });
  },
});

type RaindropGetCollectionResponse = {
  result: boolean;
  item: Record<string, unknown>;
};
