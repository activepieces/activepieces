import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient, FigraniumTaskListResponse } from '../common/client';

export const listTasksAction = createAction({
  auth: figraniumAuth,
  name: 'list_tasks',
  displayName: 'List Tasks',
  description: 'Return all task IDs, names, and descriptions',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all saved tasks on the Figranium server with their IDs, names, and descriptions. Use this to discover which tasks exist before executing one. Safe to retry.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await figraniumClient<FigraniumTaskListResponse>({
      baseUrl: context.auth.props.baseUrl,
      apiKey: context.auth.props.apiKey,
      method: HttpMethod.GET,
      resourceUri: '/api/tasks/list',
    });
    return response.tasks;
  },
});
