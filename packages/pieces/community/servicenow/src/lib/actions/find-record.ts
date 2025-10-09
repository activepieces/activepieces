import { createAction, Property } from '@activepieces/pieces-framework';

export const findRecord = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findRecord',
  displayName: 'Find Record',
  description: 'Lookup a record in a specific table',
  props: {},
  async run() {
    // Action logic here
  },
});
