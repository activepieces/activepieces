import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseAiProps } from '../../../common/ai-props';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseCollectionResultOutputSchema } from '../../../output-schemas';

export const deleteCollectionAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_delete_collection',
  outputSchema: pocketbaseCollectionResultOutputSchema,
  displayName: 'Delete Collection',
  description: 'Permanently deletes a collection and all its records.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a collection together with all its records and files; this cannot be undone. Fails if another collection has a relation field or view that depends on it. To empty a collection but keep it, use Truncate Collection.',
    idempotent: false,
  },
  props: {
    collection: pocketbaseAiProps.collection({ required: true }),
  },
  async run(context) {
    const { collection } = context.propsValue;
    await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/api/collections/${encodeURIComponent(collection)}`,
    });
    return { success: true, collection };
  },
});
