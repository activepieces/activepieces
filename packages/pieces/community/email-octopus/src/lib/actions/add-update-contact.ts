import { createAction, Property } from '@activepieces/pieces-framework';

export const addUpdateContact = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'addUpdateContact',
  displayName: 'Add Update Contact',
  description: 'Adds a new contact to a list or updates an existing contact if one exists.',
  props: {},
  async run() {
    // Action logic here
  },
});
