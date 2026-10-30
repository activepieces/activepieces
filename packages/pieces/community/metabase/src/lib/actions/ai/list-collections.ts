import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListCollectionsOutputSchema } from '../../output-schemas';

export const listCollectionsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_collections',
  outputSchema: metabaseListCollectionsOutputSchema,
  displayName: 'List Collections',
  description: 'List collections.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the collections (folders) the connection can see, with their ids and locations. Use Get Collection Tree for the nested hierarchy, or List Collection Items for what is inside one.',
    idempotent: true,
  },
  props: {
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description:
        'Yes = only trashed collections, No = only active ones. Empty = active ones.',
      required: false,
    }),
    personalOnly: metabaseAiProps.yesNo({
      displayName: 'Personal Only',
      description: 'Yes = only personal collections. Empty = all.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const collections = await metabaseApi.listCollections({
      auth,
      archived: propsValue.archived,
      personalOnly: propsValue.personalOnly,
    });
    return { collections, count: collections.length };
  },
});
