import { createAction, Property } from '@activepieces/pieces-framework';

export const createANote = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createANote',
  displayName: 'Create a Note',
  description: 'Create a note (generic) in the system.',
  props: {},
  async run() {
    // Action logic here
  },
});
