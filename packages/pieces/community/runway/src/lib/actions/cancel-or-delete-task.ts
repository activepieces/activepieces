import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { runwayAuth } from '../..';

export const cancelOrDeleteTask = createAction({
  auth: runwayAuth,
  name: 'cancel-or-delete-task',
  displayName: 'Cancel or delete a task',
  description: 'Cancel or delete a task.',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      required: true,
      description: 'The ID of the task to cancel or delete.',
    }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      required: true,
      description: 'Choose whether to cancel or delete the task.',
      options: {
        options: [
          {
            label: 'Cancel',
            value: 'cancel',
          },
          {
            label: 'Delete',
            value: 'delete',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { task_id, action } = context.propsValue;

    let method: HttpMethod;
    let url: string;

    if (action === 'cancel') {
      method = HttpMethod.POST;
      url = `https://api.runwayml.com/v1/tasks/${task_id}/cancel`;
    } else {
      method = HttpMethod.DELETE;
      url = `https://api.runwayml.com/v1/tasks/${task_id}`;
    }

    const request: HttpRequest = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${context.auth.api_key}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: true,
      task_id,
      action,
      message: `${action === 'cancel' ? 'Task cancelled' : 'Task deleted'} successfully`,
      response: response.body,
    };
  },
});
