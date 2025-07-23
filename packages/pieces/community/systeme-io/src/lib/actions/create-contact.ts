import { createAction, Property } from '@activepieces/pieces-framework';

export const createContact = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a branch new contact',
  props: {},
  async run() {
    // Action logic here
  },
});
