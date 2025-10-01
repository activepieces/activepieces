import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createAction } from '@activepieces/pieces-framework';


export const updateTaskAction = createAction({
  auth: wrikeAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Update fields of an existing task',
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New task title',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New task description',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'New task status',
      required: false,
    }),
    assignees: Property.ShortText({
      displayName: 'Assignees',
      description: 'Comma-separated list of user IDs',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date (YYYY-MM-DD format)',
      required: false,
    }),
  },
  async run(context) {
    const apiUrl = await getWrikeApiUrl(context.auth);
    const body: any = {};

    if (context.propsValue.title) {
      body.title = context.propsValue.title;
    }
    if (context.propsValue.description) {
      body.description = context.propsValue.description;
    }
    if (context.propsValue.status) {
      body.status = context.propsValue.status;
    }
    if (context.propsValue.assignees) {
      body.responsibles = context.propsValue.assignees.split(',').map((id: string) => id.trim());
    }
    if (context.propsValue.dueDate) {
      body.dates = { due: context.propsValue.dueDate };
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${apiUrl}/tasks/${context.propsValue.taskId}`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body.data[0];
  },
});