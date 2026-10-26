import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../auth';
import { qdrantClient } from '../common/client';
import { qdrantListCollectionsOutputSchema } from '../output-schemas';

export const collectionList = createAction({
  auth: qdrantAuth,
  name: 'collection_list',
  outputSchema: qdrantListCollectionsOutputSchema,
  classification: 'SEARCH',
  displayName: 'Get Collection List',
  description: 'Get the list of all the collections of your database',
  audience: 'human',
  aiMetadata: {
    description:
      'List all collections in the connected Qdrant instance. Use to discover available collection names before targeting one with another action. Takes no input. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  run: async ({ auth }) => {
    const client = qdrantClient.create({ auth });
    const collections = await client.getCollections();
    return collections;
  },
});
