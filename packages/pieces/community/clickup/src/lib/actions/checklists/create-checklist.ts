import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupCreateChecklist = createAction({
  auth: clickupAuth,
  name: 'clickup_create_checklist',
  description: 'Create a new checklist on a ClickUp task',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new checklist on a ClickUp task. The response contains the new checklist ID, which you then pass to Create Checklist Item to add items. Each call creates a separate checklist, so it is not idempotent.',
    idempotent: false,
  },
  displayName: 'Create Checklist',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
    name: Property.ShortText({
      description: 'The name of the checklist',
      displayName: 'Checklist Name',
      required: true,
    }),
  },
  async run(configValue) {
    const { task_id, name } = configValue.propsValue;

    const response = await callClickUpApi(
      HttpMethod.POST,
      `task/${task_id}/checklist`,
      getAccessTokenOrThrow(configValue.auth),
      { name }
    );

    return response.body;
  },
});
