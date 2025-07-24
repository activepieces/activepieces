import { createAction, Property } from '@activepieces/pieces-framework';

export const updateItem = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateItem',
  displayName: 'Update Item',
  description: 'Update fields on an existing item.',
  props: {},
  async run() {
    // Action logic here
  },
});
