import { createAction, Property } from '@activepieces/pieces-framework';

export const addTagToContact = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description: 'Add one or more tags to a contact in a specified list.',
  props: {},
  async run() {
    // Action logic here
  },
});
