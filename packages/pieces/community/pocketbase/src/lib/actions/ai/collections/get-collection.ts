import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseAiProps } from '../../../common/ai-props';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseCollectionOutputSchema } from '../../../output-schemas';

export const getCollectionAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_get_collection',
  outputSchema: pocketbaseCollectionOutputSchema,
  displayName: 'Get Collection',
  description: 'Gets one collection with its fields, indexes and rules.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one collection\'s full definition: type, fields with their options, indexes and API rules. Read it before Update Collection to see the current fields.',
    idempotent: true,
  },
  props: {
    collection: pocketbaseAiProps.collection({ required: true }),
  },
  async run(context) {
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/collections/${encodeURIComponent(context.propsValue.collection)}`,
    });
  },
});
