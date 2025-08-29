import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const createProject = createAction({
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a new project in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the project',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the project',
      required: false,
    }),
    organizer_id: Property.ShortText({
      displayName: 'Organizer ID',
      description: 'The ID of the user organizing the project',
      required: false,
    }),
    status: Property.Dropdown({
      displayName: 'Status',
      description: 'The status of the project',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        };
      },
      defaultValue: 'active',
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    const projectData: any = {
      name: context.propsValue.name,
    };

    if (context.propsValue.description) {
      projectData.description = context.propsValue.description;
    }

    if (context.propsValue.organizer_id) {
      projectData.organizer_id = context.propsValue.organizer_id;
    }

    if (context.propsValue.status) {
      projectData.status = context.propsValue.status;
    }

    const project = await client.createProject(projectData);
    return project;
  },
}); 