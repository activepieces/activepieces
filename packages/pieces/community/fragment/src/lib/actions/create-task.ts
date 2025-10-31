import { createAction, Property } from '@activepieces/pieces-framework';
import { fragmentAuth } from '../common/auth';
import { fragmentClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTask = createAction({
  auth: fragmentAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task in Fragment',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the task',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'A URL associated with the task (e.g., link to a ticket or resource)',
      required: false,
    }),
    due_at: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The priority level of the task',
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
    assignee: Property.ShortText({
      displayName: 'Assignee',
      description: 'Email or ID of the person to assign this task to',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to categorize the task',
      required: false,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Additional custom fields for the task',
      required: false,
    }),
  },
  async run(context) {
    const body: any = {
      title: context.propsValue.title,
    };

    if (context.propsValue.url) {
      body.url = context.propsValue.url;
    }
    if (context.propsValue.due_at) {
      body.due_at = context.propsValue.due_at;
    }
    if (context.propsValue.priority) {
      body.priority = context.propsValue.priority;
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
      HttpMethod.POST,
      '/tasks',
      context.auth,
      body
    );

    return response;
  },
});

