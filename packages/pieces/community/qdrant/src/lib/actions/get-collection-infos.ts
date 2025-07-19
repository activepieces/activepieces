import { QdrantClient } from '@qdrant/js-client-rest';
import { qdrantAuth } from '../..';
import { createAction } from '@ensemble/pieces-framework';
import { collectionName } from '../common';

export const collectionInfos = createAction({
  auth: qdrantAuth,
  name: 'collection_infos',
  displayName: 'Get Collection Infos',
  description: 'Get the all the infos of a specific collection',
  props: {
    collectionName,
  },
  run: async ({ auth, propsValue }) => {
    const client = new QdrantClient({
      apiKey: auth.key,
      url: auth.serverAddress,
    });
    const collectionName = propsValue.collectionName as string;
    const collectionInfos = await client.getCollection(collectionName);
    return collectionInfos;
  },
});
