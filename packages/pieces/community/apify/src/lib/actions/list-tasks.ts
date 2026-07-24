import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { listTasksActionOutputSchema } from '../output-schemas';

export const apifyListTasks = createAction({
  name: 'apify_list_tasks',
  auth: apifyAuth,
  displayName: 'List Tasks',
  description: 'Lists the saved Actor tasks in the authenticated account.',
  audience: 'ai',
  outputSchema: listTasksActionOutputSchema,
  aiMetadata: {
    description:
      'List the account\'s saved Actor tasks (id, name, actId) so you can resolve a task ID without a dropdown. Use this to find the task to run with Run Task or inspect with Get Task / Get Task Input. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tasks to return. Default 50.',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of tasks to skip at the start. Default 0.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { limit, offset } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const response = await client.tasks().list({
        desc: true,
        limit: limit ?? 50,
        offset: offset ?? 0,
      });

      const tasks = response.items.map((item) => ({
        id: item.id,
        name: item.name,
        title: item.title,
        actId: item.actId,
        username: item.username,
        createdAt: item.createdAt,
        modifiedAt: item.modifiedAt,
      }));

      return {
        tasks,
        count: tasks.length,
        total: response.total,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error('Permission denied listing tasks.');
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to list tasks: ${error.message || error}`);
    }
  },
});
