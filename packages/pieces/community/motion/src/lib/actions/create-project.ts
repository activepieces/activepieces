import { createAction, Property } from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';
import { BASE_URL, priority, workspaceId } from '../common/props';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createProject = createAction({
  auth: motionAuth,
  name: 'create-project',
  displayName: 'Create Project',
  description: 'Create a new project in Motion',
  props: {
    workspaceId: workspaceId('Workspace ID'),
    name: Property.ShortText({
      displayName: 'Project Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'ISO 8601 Due date on the project',
      required: false,
    }),
    priority: priority,
    labels: Property.Array({
      displayName: 'Labels',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/projects`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': auth,
      },
      body: {
        name: propsValue.name,
        workspaceId: propsValue.workspaceId,
        description: propsValue.description,
        dueDate: propsValue.dueDate,
        priority: propsValue.priority,
        labels: (propsValue.labels as string[]) || [],
      },
    });

    return response.body;
  },
});
