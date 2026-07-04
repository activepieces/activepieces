import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const deleteClickupTask = createAction({
  auth: clickupAuth,
  name: 'delete_task',
  description: 'Delete a task in a workspace and list',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a ClickUp task identified by its task ID. Pick this to remove a task entirely; this is destructive and cannot be undone, so confirm the ID before calling. Deleting an already-deleted task fails rather than succeeding, so treat it as non-idempotent.', idempotent: false },
  displayName: 'Delete Task',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id()
  },
  async run(configValue) {
    const {
      task_id,
    } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `task/${task_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
