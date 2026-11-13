import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetCollectionOutputSchema } from '../../output-schemas';

export const getCollectionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_collection',
  outputSchema: metabaseGetCollectionOutputSchema,
  displayName: 'Get Collection',
  description: 'Get a collection by ID, or the root collection.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one collection (name, location, permissions); leave Collection ID empty for the root collection ("Our analytics").',
    idempotent: true,
  },
  props: {
    collectionId: metabaseAiProps.collectionId({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getCollection({
      auth,
      collectionId: propsValue.collectionId ?? 'root',
    });
  },
});
