import { createAction, Property } from '@activepieces/pieces-framework';

export const updateTask = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateTask',
  displayName: 'Update Task',
  description: 'Modify an existing task’s details or status.',
  props: {},
  async run() {
    // Action logic here
  },
});
