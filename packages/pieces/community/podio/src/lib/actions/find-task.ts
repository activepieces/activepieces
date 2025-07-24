import { createAction, Property } from '@activepieces/pieces-framework';

export const findTask = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findTask',
  displayName: 'Find Task',
  description: 'Retrieve a task by ID for further updates.',
  props: {},
  async run() {
    // Action logic here
  },
});
