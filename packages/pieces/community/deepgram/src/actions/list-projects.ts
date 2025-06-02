import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { createDeepgramClient } from '../common/client';


export const listProjectsAction = createAction({
  auth: deepgramAuth,
  name: 'list_projects',
  displayName: 'List Projects',
  description: 'Retrieves a list of all projects associated with the account',
  props: {
    includeCompany: Property.Checkbox({
      displayName: 'Include Company Info',
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    const { includeCompany } = context.propsValue;
    const client = createDeepgramClient(context.auth);
    
    const response = await client.get('/projects');
    
    if (!includeCompany) {
      return response.body.projects.map(project => ({
        id: project.project_id,
        name: project.name
      }));
    }
    
    return response.body.projects;
  },
});