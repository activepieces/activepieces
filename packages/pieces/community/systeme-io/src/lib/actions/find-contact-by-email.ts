import { createAction, Property } from '@activepieces/pieces-framework';

export const findContactByEmail = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findContactByEmail',
  displayName: 'Find Contact by Email',
  description: 'Locate an existing contact by email address',
  props: {},
  async run() {
    // Action logic here
  },
});
