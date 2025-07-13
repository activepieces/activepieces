import { createAction, Property } from '@activepieces/pieces-framework';

export const createEmbeddings = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createEmbeddings',
  displayName: 'Create Embeddings',
  description: 'Create text embeddings for semantic search, similarity matching, etc.',
  props: {},
  async run() {
    // Action logic here
  },
});
