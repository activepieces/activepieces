import { createAction, Property } from '@activepieces/pieces-framework';

export const removeTagFromContact = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'removeTagFromContact',
  displayName: 'Remove Tag from Contact',
  description: 'Remove tag(s) from a contact in a list.',
  props: {},
  async run() {
    // Action logic here
  },
});
