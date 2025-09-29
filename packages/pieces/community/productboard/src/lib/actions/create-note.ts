import { createAction, Property } from '@activepieces/pieces-framework';

export const createNote = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createNote',
  displayName: 'Create Note',
  description: 'Add a new feedback note / insight to Productboard.',
  props: {},
  async run() {
    // Action logic here
  },
});
