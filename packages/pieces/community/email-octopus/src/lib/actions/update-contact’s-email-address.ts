import { createAction, Property } from '@activepieces/pieces-framework';

export const updateContact’sEmailAddress = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateContact’sEmailAddress',
  displayName: 'Update Contact’s Email Address',
  description: 'Change the email address of a contact',
  props: {},
  async run() {
    // Action logic here
  },
});
