import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetTaskAi = createAction({
  auth: clickupAuth,
  name: 'clickup_get_task',
  description: 'Gets a task in a ClickUp list',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieve a single ClickUp task by its task ID, optionally including its subtasks. Pick this when you already know the task ID; to find a task without an ID use List Tasks or List List Tasks. Read-only and idempotent.',
    idempotent: true,
  },
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
    const { task_id, include_subtasks } = configValue.propsValue;

    const response = await callClickUpApi(
      HttpMethod.GET,
      `task/${task_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined,
      include_subtasks ? { include_subtasks: 'true' } : undefined
    );

    return response.body;
  },
});
