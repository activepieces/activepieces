import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { getTaskInputActionOutputSchema } from '../output-schemas';

export const apifyGetTaskInput = createAction({
  name: 'apify_get_task_input',
  auth: apifyAuth,
  displayName: 'Get Task Input',
  description: 'Retrieves the stored input body of a saved Actor task by task ID.',
  audience: 'ai',
  outputSchema: getTaskInputActionOutputSchema,
  aiMetadata: {
    description:
      'Get the saved input body of a task by its task ID. Use this to inspect a task\'s current configuration before running it (Run Task) or before overwriting it (Update Task Input). Obtain the task ID from List Tasks. Read-only and idempotent.',
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
      const input = await client.task(taskId).getInput();
      return {
        taskId,
        input: input ?? null,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading input for task "${taskId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Task "${taskId}" not found. Resolve the task ID via List Tasks.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get task input: ${error.message || error}`);
    }
  },
});
