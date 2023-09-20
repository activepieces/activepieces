import { QdrantClient } from "@qdrant/js-client-rest";
import { qdrantAuth } from "../..";
import { createAction } from "@activepieces/pieces-framework";

export const collectionList = createAction({
  auth: qdrantAuth,
  name: 'collection_list',
  displayName: 'Get Collection List',
  description: 'Get the list of all the collections of your database',
  props: {},
  run: async ({auth}) => {
    const client = new QdrantClient({
      apiKey: auth.key,
      url: auth.serverAdress,
    });
    const collections = await client.getCollections();
    return collections;
  }
})