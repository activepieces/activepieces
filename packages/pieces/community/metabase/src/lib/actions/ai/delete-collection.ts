import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteCollectionOutputSchema } from '../../output-schemas';

export const deleteCollectionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_collection',
  outputSchema: metabaseDeleteCollectionOutputSchema,
  displayName: 'Delete Collection',
  description: 'Permanently delete a trashed collection.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a collection that is already in the trash (archive it first with Update Collection); this cannot be undone.',
    idempotent: false,
  },
  props: {
    collectionId: metabaseAiProps.collectionId({
      required: true,
      description:
        'Numeric ID of a trashed collection, from List Collections with Archived = Yes.',
    }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteCollection({
      auth,
      collectionId: propsValue.collectionId,
    });
    return { deleted: true, collectionId: propsValue.collectionId };
  },
});
