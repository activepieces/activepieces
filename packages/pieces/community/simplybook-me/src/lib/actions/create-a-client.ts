import { createAction, Property } from '@activepieces/pieces-framework';

export const createAClient = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createAClient',
  displayName: 'Create a Client',
  description: 'Create a new client record.',
  props: {},
  async run() {
    // Action logic here
  },
});
