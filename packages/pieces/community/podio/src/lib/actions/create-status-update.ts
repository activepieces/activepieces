import { createAction, Property } from '@activepieces/pieces-framework';

export const createStatusUpdate = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createStatusUpdate',
  displayName: 'Create Status Update',
  description: 'Add a status to an item or workspace stream.',
  props: {},
  async run() {
    // Action logic here
  },
});
