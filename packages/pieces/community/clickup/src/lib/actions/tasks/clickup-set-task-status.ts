import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupSetTaskStatusAi = createAction({
  auth: clickupAuth,
  name: 'clickup_set_task_status',
  description: 'Set the status of a ClickUp task',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change only the status of an existing ClickUp task (e.g. to In Progress or Complete). Pick this for the common "move the task to status X" intent; use Update Task to change other fields too. The status must be a valid label for the task list (select it from the Status dropdown, which lists the list-specific statuses) — a free-text or unknown status is rejected. Setting a status it already has is a no-op, so it is idempotent.',
    idempotent: true,
  },
  displayName: 'Set Task Status',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
    status_id: clickupCommon.status_id(true),
  },
  async run(configValue) {
    const { task_id, status_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.PUT,
      `task/${task_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {
        status: status_id,
      }
    );

    return response.body;
  },
});
