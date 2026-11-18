import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../auth';
import { qdrantClient } from '../common/client';
import { qdrantProps } from '../common/props';
import { deleteCollectionOutputSchema } from '../output-schemas';

export const deleteCollection = createAction({
  auth: qdrantAuth,
  name: 'delete_collection',
  outputSchema: deleteCollectionOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Collection',
  description: 'Delete a collection of your database',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently delete an entire Qdrant collection, including all of its points, identified by collection name. Use to tear down a vector store. Idempotent: re-running once the collection is gone leaves the same end state.',
    idempotent: true,
  },
  props: {
    collectionName: qdrantProps.collectionName({ required: true }),
  },
  run: async ({ auth, propsValue }) => {
    const client = qdrantClient.create({ auth });
    const collectionName = propsValue.collectionName;
    const response = await client.deleteCollection(collectionName);
    return response;
  },
});
