import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createAction } from '@activepieces/pieces-framework';


export const createTaskAction = createAction({
  auth: wrikeAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task in Wrike',
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The folder ID where the task will be created',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Task title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Task description',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Task status',
      required: false,
    }),
    importance: Property.ShortText({
      displayName: 'Importance',
      description: 'Task importance (Low, Normal, High)',
      required: false,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date (YYYY-MM-DD format)',
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
    const body: any = {
      title: context.propsValue.title,
    };

    if (context.propsValue.description) {
      body.description = context.propsValue.description;
    }
    if (context.propsValue.status) {
      body.status = context.propsValue.status;
    }
    if (context.propsValue.importance) {
      body.responsibles = context.propsValue.importance.split(',').map((id: string) => id.trim());
    }
    if (context.propsValue.startDate || context.propsValue.dueDate) {
      body.dates = {};
      if (context.propsValue.startDate) {
        body.dates.start = context.propsValue.startDate;
      }
      if (context.propsValue.dueDate) {
        body.dates.due = context.propsValue.dueDate;
      }
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${apiUrl}/folders/${context.propsValue.folderId}/tasks`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body.data[0];
  },
});
