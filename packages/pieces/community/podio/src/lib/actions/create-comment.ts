import { createAction, Property } from '@activepieces/pieces-framework';

export const createComment = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createComment',
  displayName: 'Create Comment',
  description: 'Post a comment on an item or task.',
  props: {},
  async run() {
    // Action logic here
  },
});
