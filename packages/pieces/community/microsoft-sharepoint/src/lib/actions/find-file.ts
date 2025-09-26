import { createAction, Property } from '@activepieces/pieces-framework';

export const findFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findFile',
  displayName: 'Find File',
  description: 'Look up a file by its name, path, and folder.',
  props: {},
  async run() {
    // Action logic here
  },
});
