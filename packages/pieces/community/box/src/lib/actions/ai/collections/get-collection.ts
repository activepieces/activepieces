import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetCollectionOutputSchema } from '../../../output-schemas';

export const getCollectionAction = createAction({
  auth: boxAuth,
  name: 'box_get_collection',
  outputSchema: boxGetCollectionOutputSchema,
  displayName: 'Get Collection',
  description: 'Gets a Box collection by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one collection\'s ID, name and type. Get the ID from List Collections; use List Collection Items for its contents.',
    idempotent: true,
  },
  props: {
    collectionId: boxAiProps.collectionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/collections/${encodeURIComponent(propsValue.collectionId)}`,
    });
  },
});
