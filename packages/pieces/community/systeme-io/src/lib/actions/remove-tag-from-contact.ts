import { createAction, Property } from '@activepieces/pieces-framework';

export const removeTagFromContact = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'removeTagFromContact',
  displayName: 'Remove Tag from Contact',
  description: 'Remove a tag from an existing contact',
  props: {},
  async run() {
    // Action logic here
  },
});
