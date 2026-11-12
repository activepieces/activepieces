import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';
import { taskOutputSchema } from '../../output-schemas';

export const getClickupTask = createAction({
  auth: clickupAuth,
  name: 'get_list_task',
  classification: 'READ',
  description: 'Get one ClickUp task by its ID.',
  audience: 'human',
  aiMetadata: { description: 'Retrieve a single ClickUp task by its task ID, optionally including subtasks. Pick this when you already know the task ID; use Get Task by Name to resolve a name within a list or List Team Tasks to search broadly. Read-only and idempotent.', idempotent: true },
  displayName: 'Get Task',
  props: {
    task_id: Property.ShortText({
      description: "The code at the end of the task's URL in ClickUp.",
      displayName: 'Task ID',
      placeholder: 'e.g. 86b0x1abc',
      required: true,
    }),
    include_subtasks: Property.Checkbox({
      description: "Also return the task's subtasks.",
      displayName: 'Include Subtasks',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: taskOutputSchema,
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
