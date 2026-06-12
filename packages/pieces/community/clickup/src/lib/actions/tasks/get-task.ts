import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const getClickupTask = createAction({
  auth: clickupAuth,
  name: 'get_list_task',
  description: 'Gets a task in a ClickUp list',
  audience: 'both',
  aiMetadata: { description: 'Retrieve a single ClickUp task by its task ID, optionally including subtasks. Pick this when you already know the task ID; use Get Task by Name to resolve a name within a list or List Team Tasks to search broadly. Read-only and idempotent.', idempotent: true },
  displayName: 'Get Task',
  props: {
    task_id: Property.ShortText({
      description: 'The ID of the task to get',
      displayName: 'Task ID',
      required: true,
    }),
    include_subtasks: Property.Checkbox({
      description: 'Include subtasks in the response',
      displayName: 'Include Subtasks',
      required: false,
      defaultValue: false,
    }),
  },
  async run(configValue) {
    const { task_id } = configValue.propsValue;

    const response = await callClickUpApi(
      HttpMethod.GET,
      `task/${task_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
