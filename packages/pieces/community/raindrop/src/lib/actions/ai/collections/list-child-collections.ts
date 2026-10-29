import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropApi } from '../../../common/api';
import { raindropListChildCollectionsOutputSchema } from '../../../output-schemas';

export const raindropListChildCollectionsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_list_child_collections',
  outputSchema: raindropListChildCollectionsOutputSchema,
  displayName: 'List Child Collections',
  description: 'Lists all nested (child) collections.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every nested collection (one that has a parent), each with its ID, title, bookmark count and parent.$id. Use List Collections for root collections; this action does not include them.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const items = await raindropApi.listChildCollections({ auth });
    return { items, count: items.length };
  },
});
