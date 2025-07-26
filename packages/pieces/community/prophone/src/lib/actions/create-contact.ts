import { createAction, Property } from '@activepieces/pieces-framework';

export const createContact = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createContact',
  displayName: 'create contact',
  description: 'Add a new contact to your ProPhone CRM',
  props: {},
  async run() {
    // Action logic here
  },
});
