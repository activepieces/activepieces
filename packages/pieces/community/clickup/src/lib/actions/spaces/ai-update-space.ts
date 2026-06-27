import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupUpdateSpace = createAction({
  auth: clickupAuth,
  name: 'clickup_update_space',
  description: 'Update an existing ClickUp space',
  audience: 'ai',
  aiMetadata: {
    description:
      'Update properties of an existing ClickUp space (such as renaming it or toggling multiple-assignee support) by space ID. Pick this to modify a space you already have the ID for; use Create Space to make a new one. Only the fields you supply are changed, so repeating the same update yields the same end state.',
    idempotent: true,
  },
  displayName: 'Update Space',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    name: Property.ShortText({
      description: 'The new name for the space',
      displayName: 'Space Name',
      required: false,
    }),
    multiple_assignees: Property.Checkbox({
      description: 'Allow tasks in this space to have multiple assignees',
      displayName: 'Multiple Assignees',
      required: false,
    }),
  },
  async run(configValue) {
    const { space_id, name, multiple_assignees } = configValue.propsValue;
    const body: Record<string, unknown> = {};
    if (name !== undefined) body['name'] = name;
    if (multiple_assignees !== undefined)
      body['multiple_assignees'] = multiple_assignees;
    const response = await callClickUpApi(
      HttpMethod.PUT,
      `space/${space_id}`,
      getAccessTokenOrThrow(configValue.auth),
      body
    );

    return response.body;
  },
});
