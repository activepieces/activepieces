import { createAction, Property } from '@activepieces/pieces-framework';
import { fragmentAuth } from '../common/auth';
import { fragmentClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateTask = createAction({
  auth: fragmentAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Update an existing task in Fragment',
  props: {
    task_uid: Property.ShortText({
      displayName: 'Task UID',
      description: 'The unique identifier of the task to update',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The updated title of the task',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The updated URL for the task',
      required: false,
    }),
    due_at: Property.DateTime({
      displayName: 'Due Date',
      description: 'The updated due date',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The updated priority level',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the task',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee',
      description: 'Email or ID of the person to assign this task to',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Updated tags for the task',
      required: false,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Updated custom fields',
      required: false,
    }),
  },
  async run(context) {
    const body: any = {};

    if (context.propsValue.title) {
      body.title = context.propsValue.title;
    }
    if (context.propsValue.url) {
      body.url = context.propsValue.url;
    }
    if (context.propsValue.due_at) {
      body.due_at = context.propsValue.due_at;
    }
    if (context.propsValue.priority) {
      body.priority = context.propsValue.priority;
    }
    if (context.propsValue.status) {
      body.status = context.propsValue.status;
    }
    if (context.propsValue.assignee) {
      body.assignee = context.propsValue.assignee;
    }
    if (context.propsValue.tags && Array.isArray(context.propsValue.tags)) {
      body.tags = context.propsValue.tags;
    }
    if (context.propsValue.custom_fields) {
      body.custom_fields = context.propsValue.custom_fields;
    }

    const response = await fragmentClient.makeRequest(
      HttpMethod.PATCH,
      `/tasks/${context.propsValue.task_uid}`,
      context.auth,
      body
    );

    return response;
  },
});

