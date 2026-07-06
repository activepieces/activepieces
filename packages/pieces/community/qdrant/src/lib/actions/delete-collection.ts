import { createAction } from '@activepieces/pieces-framework';
import { qdrantAuth } from '../..';
import { QdrantClient } from '@qdrant/js-client-rest';
import { collectionName } from '../common';

export const deleteCollection = createAction({
  auth: qdrantAuth,
  name: 'delete_collection',
  displayName: 'Delete Collection',
  description: 'Delete a collection of your database',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete an entire Qdrant collection, including all of its points, identified by collection name. Use to tear down a vector store. Idempotent: re-running once the collection is gone leaves the same end state.',
    idempotent: true,
  },
  props: {
    collectionName,
  },
  run: async ({ auth, propsValue }) => {
    const client = new QdrantClient({
      apiKey: auth.props.key,
      url: auth.props.serverAddress,
    });
    const collectionName = propsValue.collectionName as string;
    const response = await client.deleteCollection(collectionName);
    return response;
  },
});
