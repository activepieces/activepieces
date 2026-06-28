import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

const RUN_STATUS_OPTIONS = [
  { label: 'Ready', value: 'READY' },
  { label: 'Running', value: 'RUNNING' },
  { label: 'Succeeded', value: 'SUCCEEDED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Timing Out', value: 'TIMING-OUT' },
  { label: 'Timed Out', value: 'TIMED-OUT' },
  { label: 'Aborting', value: 'ABORTING' },
  { label: 'Aborted', value: 'ABORTED' },
];

export const apifyGetTaskLastRun = createAction({
  name: 'apify_get_task_last_run',
  auth: apifyAuth,
  displayName: 'Get Task Last Run',
  description: 'Retrieves the most recent run of a saved Actor task, optionally filtered by status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the most recent run of a saved task by its task ID, optionally restricted to a status (e.g. SUCCEEDED). Use this when you have the task ID but not a run ID — for example to find the run to poll with Get Actor Run (task analogue of Get Last Actor Run). Use Get Task Last Run Dataset Items to jump straight to its results. Obtain the task ID from List Tasks. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the saved task. Obtain it from List Tasks.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Optionally restrict to the last run with this status.',
      required: false,
      options: { options: RUN_STATUS_OPTIONS },
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { taskId, status } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const run = await client
        .task(taskId)
        .lastRun({ status: status ? (status as any) : undefined })
        .get();

      if (!run) {
        throw new Error(`No matching run found for task "${taskId}".`);
      }
      return run;
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading runs for task "${taskId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Task "${taskId}" not found, or it has no runs. Resolve the task ID via List Tasks.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get task last run: ${error.message || error}`);
    }
  },
});
