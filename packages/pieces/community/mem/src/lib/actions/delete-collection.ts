import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const deleteCollectionAction = createAction({
  auth: memAuth,
  name: 'delete_collection',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Collection',
  description: 'Permanently delete a collection. Its notes are not deleted.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a Mem collection by ID. The notes in it are kept. Destructive but idempotent: repeating the call with the same ID also returns success and leaves the collection deleted.',
    idempotent: true,
  },
  props: {
    collection_id: memProps.collectionDropdown({ displayName: 'Collection', description: 'The collection to delete.', required: true }),
  },
  outputSchema: memSchemas.requestId,
  async run(context) {
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: memClient.encodePath`/collections/${context.propsValue.collection_id}`,
    });
  },
});
