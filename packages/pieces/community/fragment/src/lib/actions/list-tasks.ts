import { createAction, Property } from '@activepieces/pieces-framework';
import { fragmentAuth } from '../common/auth';
import { fragmentClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const listTasks = createAction({
  auth: fragmentAuth,
  name: 'list_tasks',
  displayName: 'List Tasks',
  description: 'Retrieve a list of tasks from Fragment',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter tasks by status',
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
      description: 'Filter tasks by assignee email or ID',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tasks to return (default: 50)',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of tasks to skip for pagination (default: 0)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.status) {
      queryParams.status = context.propsValue.status;
    }
    if (context.propsValue.assignee) {
      queryParams.assignee = context.propsValue.assignee;
    }
    if (context.propsValue.limit !== undefined) {
      queryParams.limit = context.propsValue.limit.toString();
    }
    if (context.propsValue.offset !== undefined) {
      queryParams.offset = context.propsValue.offset.toString();
    }

    const response = await fragmentClient.makeRequest(
      HttpMethod.GET,
      '/tasks',
      context.auth,
      undefined,
      queryParams
    );

    return response;
  },
});

