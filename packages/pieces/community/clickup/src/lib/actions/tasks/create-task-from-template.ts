import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const createClickupTaskFromTemplate = createAction({
  auth: clickupAuth,
  name: 'create_task_from_template',
  description: 'Create a new task from Template',
  audience: 'both',
  aiMetadata: { description: 'Create a new ClickUp task in a list by instantiating an existing task template, supplying only the new task name. Pick this when the task should inherit structure (subtasks, fields, defaults) from a saved template; use Create Task for a task built from scratch. Each call creates a distinct task, so it is not idempotent.', idempotent: false },
  displayName: 'Create Task From Template',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    template_id: clickupCommon.template_id(true),
    name: Property.ShortText({
      description: 'The name of the task to create',
      displayName: 'Task Name',
      required: true,
    }),
  },
  async run(configValue) {
    const { list_id, name, template_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.POST,
      `list/${list_id}/taskTemplate/${template_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name,
      }
    );

    return response.body;
  },
});
