import { createAction, Property } from '@activepieces/pieces-framework';

export const createTask = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Add a new task to an item or workspace.',
  props: {},
  async run() {
    // Action logic here
  },
});
