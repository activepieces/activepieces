import { createAction, Property } from '@activepieces/pieces-framework';

export const findFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findFile',
  displayName: 'Find File',
  description: 'Find a file (attachment) by filename',
  props: {},
  async run() {
    // Action logic here
  },
});
