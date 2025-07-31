import { createAction, Property } from '@activepieces/pieces-framework';

export const getMessage = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getMessage',
  displayName: 'Get Message',
  description: '',
  props: {},
  async run() {
    // Action logic here
  },
});
