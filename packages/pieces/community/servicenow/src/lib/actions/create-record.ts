import { createAction, Property } from '@activepieces/pieces-framework';

export const createRecord = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createRecord',
  displayName: 'Create Record',
  description: 'Create a record in a specified table with provided fields.',
  props: {},
  async run() {
    // Action logic here
  },
});
