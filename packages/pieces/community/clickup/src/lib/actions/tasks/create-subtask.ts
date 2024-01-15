import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../../';

export const createClickupSubtask = createAction({
  auth: clickupAuth,
  name: 'create_subtask',
  description: 'Creates a subtask in ClickUp',
  displayName: 'Create Subtask',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
    name: Property.ShortText({
      description: 'The name of the task to create',
      displayName: 'Task Name',
      required: true,
    }),
    description: Property.LongText({
      description: 'The description of the task to create',
      displayName: 'Task Description',
      required: true,
    }),
  },
  async run(configValue) {
    const { list_id, task_id, name, description } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.POST,
      `list/${list_id}/task`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name,
        description,
        parent: task_id,
      }
    );

    return response.body;
  },
});
