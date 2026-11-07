import { createAction } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../auth';
import { qdrantClient } from '../common/client';
import { qdrantProps } from '../common/props';
import { qdrantGetCollectionOutputSchema } from '../output-schemas';

export const collectionInfos = createAction({
  auth: qdrantAuth,
  name: 'collection_infos',
  outputSchema: qdrantGetCollectionOutputSchema,
  classification: 'READ',
  displayName: 'Get Collection Infos',
  description: 'Get the all the infos of a specific collection',
  audience: 'human',
  aiMetadata: {
    description:
      'Retrieve configuration and status details for a single Qdrant collection by name (vector params, point counts, indexing state, etc.). Use to inspect a collection before reading from or writing to it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    collectionName: qdrantProps.collectionName({ required: true }),
  },
  run: async ({ auth, propsValue }) => {
    const client = qdrantClient.create({ auth });
    const collectionName = propsValue.collectionName;
    const collectionInfos = await client.getCollection(collectionName);
    return collectionInfos;
  },
});
