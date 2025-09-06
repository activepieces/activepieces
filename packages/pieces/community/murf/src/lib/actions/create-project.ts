import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';

export const createProject = createAction({
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a new project in Murf AI',
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the project to create',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Project Description',
      description: 'The description of the project',
      required: false,
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder to create the project in (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth;
    const { name, description, folder_id } = context.propsValue;

    const response = await makeRequest({
      method: HttpMethod.POST,
      apiKey,
      baseUrl,
      path: '/projects',
      body: {
        name,
        description,
        folder_id,
      },
    });

    return response;
  },
});