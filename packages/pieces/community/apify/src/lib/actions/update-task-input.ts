import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyUpdateTaskInput = createAction({
  name: 'apify_update_task_input',
  auth: apifyAuth,
  displayName: 'Update Task Input',
  description: 'Overwrites the stored input body of a saved Actor task by task ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Overwrite the entire stored input of a saved task with a new JSON body. Use this to reconfigure a task before running it (reconfigure-then-run); to override input for a single run only, pass it to Run Task instead of changing the task. Inspect the current input first with Get Task Input. Obtain the task ID from List Tasks. Idempotent — it sets the task input to the given state, so repeating the same call has the same effect.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the saved task to reconfigure. Obtain it from List Tasks.',
      required: true,
    }),
    input: Property.Json({
      displayName: 'Input JSON',
      description:
        'The full JSON input body to store on the task. This replaces the existing input entirely. Match the Actor\'s input schema (see Get Actor Input Schema for the task\'s actor).',
      required: true,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { taskId, input } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const updated = await client
        .task(taskId)
        .updateInput(input as Record<string, unknown>);
      return {
        taskId,
        input: updated,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied updating input for task "${taskId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Task "${taskId}" not found. Resolve the task ID via List Tasks.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to update task input: ${error.message || error}`);
    }
  },
});
