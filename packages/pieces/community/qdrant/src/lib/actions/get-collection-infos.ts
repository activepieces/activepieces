import { QdrantClient } from '@qdrant/js-client-rest';
import { qdrantAuth } from '../..';
import { createAction } from '@activepieces/pieces-framework';
import { collectionName } from '../common';

export const collectionInfos = createAction({
  auth: qdrantAuth,
  name: 'collection_infos',
  displayName: 'Get Collection Infos',
  description: 'Get the all the infos of a specific collection',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve configuration and status details for a single Qdrant collection by name (vector params, point counts, indexing state, etc.). Use to inspect a collection before reading from or writing to it. Read-only and idempotent.',
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
    const collectionInfos = await client.getCollection(collectionName);
    return collectionInfos;
  },
});
