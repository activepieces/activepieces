import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../../';

export const createClickupTaskFromTemplate = createAction({
  auth: clickupAuth,
  name: 'create_task_from_template',
  description: 'Create a new task from Template',
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
