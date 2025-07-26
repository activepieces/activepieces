import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { PodioTask } from '../common/types';

export const findTaskAction = createAction({
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Searches for tasks in Podio.',
  auth: podioAuth,
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter tasks by status',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Completed', value: 'completed' },
        ],
      },
      defaultValue: 'all',
    }),
    responsibleUserId: Property.Number({
      displayName: 'Responsible User ID',
      description: 'Filter tasks by responsible user',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tasks to return (default: 10)',
      required: false,
      defaultValue: 10,
    }),
    completed: Property.Checkbox({
      displayName: 'Include Completed',
      description: 'Whether to include completed tasks',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { status, responsibleUserId, limit, completed } = context.propsValue;

    const query: Record<string, any> = {
      limit: limit || 10,
    };

    if (status && status !== 'all') {
      query['completed'] = status === 'completed';
    } else if (completed !== undefined) {
      query['completed'] = completed;
    } else {
      // Podio API requires filtering - default to active tasks if no status specified
      query['completed'] = false;
    }

    if (responsibleUserId) {
      query['responsible'] = responsibleUserId;
    }

    // https://developers.podio.com/doc/tasks/get-tasks-77949
    const response = await podioApiCall<PodioTask[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: '/task/',
      query,
    });

    return Array.isArray(response) ? response : [response];
  },
});