import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi3 } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupMoveTaskToListAi = createAction({
  auth: clickupAuth,
  name: 'clickup_move_task_to_list',
  description: "Move a task to a different list (the task's home list)",
  audience: 'ai',
  aiMetadata: {
    description:
      "Re-home a ClickUp task by moving it to a different list, changing the task's home (primary) list. Pick this to relocate a task; to instead make a task appear in an extra list without changing its home use Add Task To List, and to remove a task entirely use Delete Task. Provide the destination list ID (resolve via Get List). Moving a task to its current home list is a no-op, so it is idempotent.",
    idempotent: true,
  },
  displayName: 'Move Task To List',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
    destination_list_id: Property.ShortText({
      displayName: 'Destination List ID',
      description:
        'The ID of the list to move the task into (its new home list). Resolve via Get List.',
      required: true,
    }),
  },
  async run(configValue) {
    const { workspace_id, task_id, destination_list_id } =
      configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.PUT,
      `workspaces/${workspace_id}/tasks/${task_id}/home_list/${destination_list_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
