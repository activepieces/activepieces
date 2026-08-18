import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import qs from 'qs';

import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetBulkTasksTimeInStatusAi = createAction({
  auth: clickupAuth,
  name: 'clickup_get_bulk_tasks_time_in_status',
  description: 'Get how long several tasks have spent in each status',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieve the status dwell times for several ClickUp tasks in one call, given a list of task IDs. Pick this for multiple tasks; for a single task use Get Task Time In Status. Provide up to about 100 task IDs per call. Read-only and idempotent.',
    idempotent: true,
  },
  displayName: 'Get Bulk Tasks Time In Status',
  props: {
    task_ids: Property.Array({
      displayName: 'Task IDs',
      description: 'The task IDs to read status dwell times for (up to ~100).',
      required: true,
    }),
  },
  async run(configValue) {
    const taskIds = configValue.propsValue.task_ids as string[];
    if (!taskIds || taskIds.length === 0) {
      throw new Error('At least one task ID is required.');
    }

    const query = qs.stringify(
      { task_ids: taskIds },
      { arrayFormat: 'repeat' }
    );

    const response = await callClickUpApi(
      HttpMethod.GET,
      `task/bulk_time_in_status/task_ids?${query}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
