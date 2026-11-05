import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateCollectionOutputSchema } from '../../output-schemas';

export const createCollectionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_collection',
  outputSchema: metabaseCreateCollectionOutputSchema,
  displayName: 'Create Collection',
  description: 'Create a collection.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a collection (folder), optionally inside another one. Each call creates a new collection, even with the same name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    parentId: metabaseAiProps.collectionId({
      required: false,
      displayName: 'Parent Collection ID',
      description:
        'Create it inside this collection, from List Collections. Empty = the root collection.',
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createCollection({
      auth,
      body: {
        name: propsValue.name,
        description: propsValue.description,
        parent_id: propsValue.parentId,
      },
    });
  },
});
