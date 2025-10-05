import { createAction, Property } from '@activepieces/pieces-framework';

export const findClient = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findClient',
  displayName: 'Find Client',
  description: 'Find Clients.',
  props: {},
  async run() {
    // Action logic here
  },
});
