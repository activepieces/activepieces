import { createAction, Property } from '@activepieces/pieces-framework';

export const clearColumnByIndex = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'clearColumnByIndex',
  displayName: 'Clear Column by Index',
  description: 'Clear contents/formatting of a column by its index',
  props: {},
  async run() {
    // Action logic here
  },
});
