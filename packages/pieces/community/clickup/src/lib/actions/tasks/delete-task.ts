import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../../';

export const deleteClickupTask = createAction({
  auth: clickupAuth,
  name: 'delete_task',
  description: 'Delete a task in a workspace and list',
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
