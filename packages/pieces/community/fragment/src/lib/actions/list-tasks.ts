import { createAction, Property } from '@activepieces/pieces-framework';
import { fragmentAuth } from '../common/auth';
import { fragmentClient } from '../common/client';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const listTasks = createAction({
  auth: fragmentAuth,
  name: 'list_tasks',
  displayName: 'List Tasks',
  description: 'Retrieves a list of tasks from.',
  audience: 'both',
  aiMetadata: { description: 'Lists tasks from Fragment, optionally filtered by status (TODO/STARTED/DONE) and assignee, and capped by a limit (default 50). Omit the filters to return recent tasks across all statuses. Use to discover task UIDs or survey tasks before acting on them. Read-only and idempotent.', idempotent: true },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter tasks by status',
      required: false,
      options: {
        options: [
          { label: 'TODO', value: 'TODO' },
          { label: 'STARTED', value: 'STARTED' },
          { label: 'DONE', value: 'DONE' },
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
  },
  async run(context) {
    const queryParams: QueryParams = {};

    if (context.propsValue.status) {
      queryParams['status'] = context.propsValue.status;
    }
    if (context.propsValue.assignee) {
      queryParams['assignee_uid'] = context.propsValue.assignee;
    }
    if (context.propsValue.limit !== undefined) {
      queryParams['limit'] = context.propsValue.limit.toString();
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

