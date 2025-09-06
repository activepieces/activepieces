import { createAction, Property } from '@activepieces/pieces-framework';

export const createProject = createAction({
  name: 'createProject',
  displayName: 'Create Project',
  description: 'Creates a new project.',
  props: {},
  async run() {
    // Action logic here
  },
});
