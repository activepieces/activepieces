import { createAction, Property } from '@activepieces/pieces-framework';

export const moveFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'moveFile',
  displayName: 'Move File',
  description: 'Move a file from one folder to another',
  props: {},
  async run() {
    // Action logic here
  },
});
