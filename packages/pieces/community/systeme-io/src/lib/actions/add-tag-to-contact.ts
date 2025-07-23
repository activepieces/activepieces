import { createAction, Property } from '@activepieces/pieces-framework';

export const addTagToContact = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description: 'Assign a tag to an existing contact',
  props: {},
  async run() {
    // Action logic here
  },
});
