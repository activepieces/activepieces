import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokenTerminalAuth, makeRequest } from '../common/token-terminal-api';

export const getAllProjects = createAction({
  auth: tokenTerminalAuth,
  name: 'getAllProjects',
  displayName: 'Get All Projects',
  description: 'Retrieve a list of all protocols and projects tracked by Token Terminal.',
  props: {},
  async run(context) {
    return makeRequest(context.auth as string, HttpMethod.GET, '/projects');
  },
});
