import { createAction, Property } from '@activepieces/pieces-framework';

export const updateContact = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update fields',
  props: {},
  async run() {
    // Action logic here
  },
});
