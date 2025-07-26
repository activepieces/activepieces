import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { PodioTask } from '../common/types';

export const updateTaskAction = createAction({
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Updates an existing task in Podio.',
  auth: podioAuth,
  props: {
    taskId: Property.Number({
      displayName: 'Task ID',
      description: 'The ID of the task to update',
      required: true,
    }),
    text: Property.ShortText({
      displayName: 'Task Text',
      description: 'The title/text of the task',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Detailed description of the task',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due',
      required: false,
    }),
    isPrivate: Property.Checkbox({
      displayName: 'Private Task',
      description: 'Whether the task is private',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Task status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Completed', value: 'completed' },
        ],
      },
    }),
    responsibleUserId: Property.Number({
      displayName: 'Responsible User ID',
      description: 'ID of the user responsible for this task',
      required: false,
    }),
  },
  async run(context) {
    const {
      taskId,
      text,
      description,
      dueDate,
      isPrivate,
      status,
      responsibleUserId,
    } = context.propsValue;

    if (!taskId) {
      throw new Error('Task ID is required.');
    }

    const body: any = {};

    if (text) {
      body.text = text;
    }

    if (description) {
      body.description = description;
    }

    if (dueDate) {
      body.due_date = dueDate;
    }

    if (isPrivate !== undefined) {
      body.private = isPrivate;
    }

    if (responsibleUserId) {
      body.responsible = responsibleUserId;
    }

    // Handle status update separately if needed
    if (status === 'completed') {
      await podioApiCall({
        auth: context.auth,
        method: HttpMethod.POST,
        resourceUri: `/task/${taskId}/complete`,
      });
    } else if (status === 'active') {
      await podioApiCall({
        auth: context.auth,
        method: HttpMethod.POST,
        resourceUri: `/task/${taskId}/incomplete`,
      });
    }

    // https://developers.podio.com/doc/tasks/update-task-10583674
    const response = await podioApiCall<PodioTask>({
      auth: context.auth,
      method: HttpMethod.PUT,
      resourceUri: `/task/${taskId}`,
      body,
    });

    return response;
  },
});