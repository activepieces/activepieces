import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetCollectionTreeOutputSchema } from '../../output-schemas';

export const getCollectionTreeAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_collection_tree',
  outputSchema: metabaseGetCollectionTreeOutputSchema,
  displayName: 'Get Collection Tree',
  description: 'Get the nested hierarchy of collections.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every collection as a nested tree (each with its children), to resolve a path like "Marketing / Reports" to a collection id.',
    idempotent: true,
  },
  props: {
    excludeArchived: Property.Checkbox({
      displayName: 'Exclude Archived',
      description: 'Leave out trashed collections.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const collections = await metabaseApi.getCollectionTree({
      auth,
      excludeArchived: propsValue.excludeArchived ?? true,
    });
    return { collections, count: collections.length };
  },
});
