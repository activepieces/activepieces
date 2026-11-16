import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseAiProps } from '../../../common/ai-props';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseCollectionResultOutputSchema } from '../../../output-schemas';

export const truncateCollectionAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_truncate_collection',
  outputSchema: pocketbaseCollectionResultOutputSchema,
  displayName: 'Truncate Collection',
  description: 'Permanently deletes every record in a collection, keeping the collection.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes every record and file in a collection while keeping the collection and its fields; this cannot be undone. Relations that cascade delete in other collections are removed too. To delete one record use Delete Record.',
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
      path: `/api/collections/${encodeURIComponent(collection)}/truncate`,
    });
    return { success: true, collection };
  },
});
