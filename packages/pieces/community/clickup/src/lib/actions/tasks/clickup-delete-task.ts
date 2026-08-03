import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupDeleteTaskAi = createAction({
  auth: clickupAuth,
  name: 'clickup_delete_task',
  description: 'Delete a task in a workspace and list',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete a ClickUp task identified by its task ID. Pick this to remove a task entirely; to move it to another list instead use Move Task To List. This is destructive and cannot be undone, and deleting an already-deleted task errors, so it is not idempotent.',
    idempotent: false,
  },
  displayName: 'Delete Task',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
  },
  async run(configValue) {
    const { task_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `task/${task_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
