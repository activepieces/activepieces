import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { getTaskActionOutputSchema } from '../output-schemas';

export const apifyGetTask = createAction({
  name: 'apify_get_task',
  auth: apifyAuth,
  displayName: 'Get Task',
  description: 'Retrieves metadata for a saved Actor task by task ID.',
  audience: 'ai',
  outputSchema: getTaskActionOutputSchema,
  aiMetadata: {
    description:
      'Get metadata for one saved task by its task ID (name, actId, run options). Use this to inspect which Actor a task wraps before running it; use Get Task Input to see its stored input. Obtain the task ID from List Tasks. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the saved task. Obtain it from List Tasks.',
      required: true,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { taskId } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const task = await client.task(taskId).get();
      if (!task) {
        throw new Error(
          `Task "${taskId}" not found. Resolve the task ID via List Tasks.`
        );
      }
      return task;
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading task "${taskId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Task "${taskId}" not found. Resolve the task ID via List Tasks.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get task: ${error.message || error}`);
    }
  },
});
