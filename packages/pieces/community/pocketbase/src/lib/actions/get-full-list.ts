import { createAction, Property } from '@activepieces/pieces-framework';

export const getFullList = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getFullList',
  displayName: 'get full list',
  description: 'Gets all the data for a given collection',
  props: {},
  async run() {
    // Action logic here
    console.log('get full list action executed');
  },
});
