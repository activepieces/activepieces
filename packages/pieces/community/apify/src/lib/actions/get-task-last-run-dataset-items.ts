import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';

export const apifyGetTaskLastRunDatasetItems = createAction({
  name: 'apify_get_task_last_run_dataset_items',
  auth: apifyAuth,
  displayName: 'Get Task Last Run Dataset Items',
  description: 'Retrieves the dataset items of a task\'s most recent run by task ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read the result rows of a saved task\'s most recent run directly by task ID, with optional offset/limit paging. Use this one-shot shortcut to get "the latest results of this task" without chaining run/dataset IDs (the task analogue of Get Actor Last Run Dataset Items). Optionally restrict to a status. Resolve the task ID with List Tasks. Read-only and idempotent.',
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
      description:
        'Optionally restrict to the last run with this status (e.g. SUCCEEDED).',
      required: false,
      options: {
        options: [
          { label: 'Succeeded', value: 'SUCCEEDED' },
          { label: 'Failed', value: 'FAILED' },
          { label: 'Running', value: 'RUNNING' },
          { label: 'Aborted', value: 'ABORTED' },
          { label: 'Timed Out', value: 'TIMED-OUT' },
        ],
      },
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of items to skip at the start. Default 0.',
      required: false,
      defaultValue: 0,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return. Must be greater than 0.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { taskId, status, offset, limit } = context.propsValue;

    if (offset != null && offset < 0) {
      throw new Error('Offset must be greater than or equal to 0.');
    }
    if (limit != null && limit <= 0) {
      throw new Error('Limit must be greater than 0.');
    }

    const client = createApifyClient(apifyToken);

    try {
      const response = await client
        .task(taskId)
        .lastRun({ status: status ? (status as any) : undefined })
        .dataset()
        .listItems({ limit, offset });

      return {
        items: response.items,
        count: response.count,
        total: response.total,
        offset: response.offset,
        limit: response.limit,
        taskId,
      };
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(
          `Permission denied reading the last run dataset for task "${taskId}".`
        );
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Task "${taskId}" not found or it has no matching run. Resolve the task ID with List Tasks.`
        );
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(
        `Failed to read task last run dataset items: ${error.message || error}`
      );
    }
  },
});
