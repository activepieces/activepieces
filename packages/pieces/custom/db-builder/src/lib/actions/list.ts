import { createAction, Property } from '@activepieces/pieces-framework';

export const list = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'list',
  displayName: 'list',
  description: 'get list of rows from selected table',
  props: {},
  async run() {
    return {success:"test"}
    // Action logic here
  },
});
