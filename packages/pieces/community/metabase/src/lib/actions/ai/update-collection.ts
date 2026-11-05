import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateCollectionOutputSchema } from '../../output-schemas';

export const updateCollectionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_collection',
  outputSchema: metabaseUpdateCollectionOutputSchema,
  displayName: 'Update Collection',
  description: 'Rename, move or archive a collection.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a collection: name, description, parent (to move it) or archive state. Archiving moves it and its contents to the trash (recoverable).',
    idempotent: true,
  },
  props: {
    collectionId: metabaseAiProps.collectionId({
      required: true,
      description: 'Numeric ID of the collection, from List Collections.',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name. Empty = unchanged.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description. Empty = unchanged.',
      required: false,
    }),
    parentId: Property.Number({
      displayName: 'Parent Collection ID',
      description:
        'Move it inside this collection, from List Collections. Empty = unchanged.',
      required: false,
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description:
        'Yes moves the collection to the trash, No restores it. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateCollection({
      auth,
      collectionId: propsValue.collectionId,
      body: {
        name: propsValue.name,
        description: propsValue.description,
        parent_id: propsValue.parentId,
        archived: propsValue.archived,
      },
    });
  },
});
