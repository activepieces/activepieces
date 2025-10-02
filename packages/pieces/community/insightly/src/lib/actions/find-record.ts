import { createAction, Property } from '@activepieces/pieces-framework';

export const findRecord = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findRecord',
  displayName: 'Find Record',
  description: 'Look up an existing record (of a specified object) by a search field & value',
  props: {},
  async run() {
    // Action logic here
  },
});
