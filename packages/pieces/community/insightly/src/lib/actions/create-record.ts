import { createAction, Property } from '@activepieces/pieces-framework';

export const createRecord = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createRecord',
  displayName: 'Create Record',
  description: 'Create a new record in a specified Insightly object (Contact, Lead, Opportunity, etc.)',
  props: {},
  async run() {
    // Action logic here
  },
});
