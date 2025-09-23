import { createAction, Property } from '@activepieces/pieces-framework';

export const findContact = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Look up a contact by email address within a given list.',
  props: {},
  async run() {
    // Action logic here
  },
});
