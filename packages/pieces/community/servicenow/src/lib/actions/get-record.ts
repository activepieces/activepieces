import { createAction, Property } from '@activepieces/pieces-framework';

export const getRecord = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getRecord',
  displayName: 'Get Record',
  description: 'Gets specific table record.',
  props: {},
  async run() {
    // Action logic here
  },
});
