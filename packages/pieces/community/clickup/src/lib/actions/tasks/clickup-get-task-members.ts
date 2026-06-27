import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetTaskMembersAi = createAction({
  auth: clickupAuth,
  name: 'clickup_get_task_members',
  description: 'List the members who have access to a task',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the people who have access to a ClickUp task, identified by its task ID. Use this to discover member IDs (e.g. before assigning) or to check who can see a task. Read-only and idempotent.',
    idempotent: true,
  },
  displayName: 'Get Task Members',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to list members for.',
      required: true,
    }),
  },
  async run(configValue) {
    const { task_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `task/${task_id}/member`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
