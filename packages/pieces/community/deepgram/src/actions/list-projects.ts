import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { createDeepgramClient } from '../common/client';

export const listProjects = createAction({
  auth: deepgramAuth,
  name: 'list-projects',
  displayName: 'List Projects',
  description: 'Retrieves a list of all projects associated with the Deepgram account',
  props: {},
  async run({ auth }) {
    const client = createDeepgramClient(auth);

    try {
      const response = await client.get('/projects');
      const result = response.body as any;
      
      return {
        projects: result.projects || [],
        total_projects: result.projects ? result.projects.length : 0,
        raw_response: result,
      };
    } catch (error) {
      throw new Error(`Failed to list projects: ${error}`);
    }
  },
});
