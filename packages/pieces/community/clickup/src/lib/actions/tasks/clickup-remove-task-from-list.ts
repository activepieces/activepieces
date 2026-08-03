import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupRemoveTaskFromListAi = createAction({
  auth: clickupAuth,
  name: 'clickup_remove_task_from_list',
  description: 'Remove a task from an additional list',
  audience: 'ai',
  aiMetadata: {
    description:
      "Remove a ClickUp task from an additional (non-home) list. This requires the \"Tasks in Multiple Lists\" ClickApp to be enabled. It only detaches the task from an extra list — it does not delete the task or change its home list (use Delete Task or Move Task To List for those). Removing it from a list it is not in is a no-op, so it is idempotent.",
    idempotent: true,
  },
  displayName: 'Remove Task From List',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to remove from the list.',
      required: true,
    }),
  },
  async run(configValue) {
    const { list_id, task_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `list/${list_id}/task/${task_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
