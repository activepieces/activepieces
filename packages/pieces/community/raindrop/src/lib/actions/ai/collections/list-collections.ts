import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropApi } from '../../../common/api';
import { raindropListCollectionsOutputSchema } from '../../../output-schemas';

export const raindropListCollectionsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_list_collections',
  outputSchema: raindropListCollectionsOutputSchema,
  displayName: 'List Collections',
  description: 'Lists all root (top-level) collections.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every root (top-level) collection with its ID, title, bookmark count, sort position and settings. Use List Child Collections for nested collections; together they give every collection ID other actions take.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const items = await raindropApi.listCollections({ auth });
    return { items, count: items.length };
  },
});
