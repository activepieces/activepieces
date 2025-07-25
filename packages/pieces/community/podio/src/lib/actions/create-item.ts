import { createAction, Property } from '@activepieces/pieces-framework';

export const createItem = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createItem',
  displayName: 'Create Item',
  description: 'Create a new record in a Podio app.',
  props: {},
  async run() {
    // Action logic here
  },
});
