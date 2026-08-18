import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import {
  createApifyClient,
  createRunOptions,
  handleRun,
} from '../common';
import { runTaskActionOutputSchema } from '../output-schemas';

export const apifyRunTask = createAction({
  name: 'apify_run_task',
  auth: apifyAuth,
  displayName: 'Run Task',
  description: 'Runs a saved Apify Actor task by ID and optionally waits for it to finish.',
  audience: 'ai',
  outputSchema: runTaskActionOutputSchema,
  aiMetadata: {
    description:
      'Run a saved Apify Actor task (an Actor pre-configured with stored input) by its task ID, optionally overriding the stored input. Resolve the task ID with List Tasks; inspect its stored input with Get Task Input. Prefer this over Run Actor when the user already has a configured task. Set waitForFinish=true only for short runs (blocks server-side ~60s); for long runs leave false and poll with Get Actor Run. Not idempotent — each call launches a new run.',
    idempotent: false,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description:
        'The ID of the saved task to run. Obtain it from List Tasks.',
      required: true,
    }),
    input: Property.Json({
      displayName: 'Override Input JSON',
      description:
        'Optional JSON to override the task\'s stored input for this run only. If omitted, the task runs with its saved input (see Get Task Input).',
      required: false,
    }),
    build: Property.ShortText({
      displayName: 'Build',
      description:
        'Build to run — a build tag or build number. Defaults to the build in the task settings.',
      required: false,
    }),
    memory: Property.Number({
      displayName: 'Memory (MB)',
      description:
        'Memory limit for the run in megabytes. Defaults to the task settings.',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (seconds)',
      description:
        'Optional timeout for the run in seconds. Defaults to the task settings.',
      required: false,
    }),
    waitForFinish: Property.Checkbox({
      displayName: 'Wait for finish',
      description:
        'If true, block until the run finishes (server-side, capped ~60s) and return its dataset items. For long runs leave false and poll with Get Actor Run.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { taskId, input, timeout, build, memory, waitForFinish } =
      context.propsValue;

    const client = createApifyClient(apifyToken);

    const runOptions = createRunOptions({ timeout, memory, build });
    const resourceClient = client.task(taskId);

    try {
      return await handleRun({
        resourceClient,
        // Pass undefined (not {}) when no override is given so Apify uses the
        // task's saved input instead of overriding it with an empty object.
        body: input as Record<string, unknown> | undefined,
        runOptions,
        waitForFinish: waitForFinish || false,
        client,
      });
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(
          `Permission denied running task "${taskId}". Your account may not have access to this task or has hit a plan limit.`
        );
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Task "${taskId}" not found. Resolve the task ID with List Tasks.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to run task: ${error.message || error}`);
    }
  },
});
