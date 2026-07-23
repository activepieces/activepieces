import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupCreateSpace = createAction({
  auth: clickupAuth,
  name: 'clickup_create_space',
  description: 'Create a new space in a ClickUp workspace',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new space in a ClickUp workspace (team) to hold folders and lists. Pick this to add a new top-level container in a workspace; to add a folder or list within an existing space, use Create Folder or Create Folderless List. Each call creates a new space even with the same name, so retries duplicate it.',
    idempotent: false,
  },
  displayName: 'Create Space',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    name: Property.ShortText({
      description: 'The name of the space to create',
      displayName: 'Space Name',
      required: true,
    }),
    multiple_assignees: Property.Checkbox({
      description: 'Allow tasks in this space to have multiple assignees',
      displayName: 'Multiple Assignees',
      required: false,
      defaultValue: true,
    }),
  },
  async run(configValue) {
    const { workspace_id, name, multiple_assignees } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.POST,
      `team/${workspace_id}/space`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name,
        multiple_assignees: multiple_assignees ?? true,
      }
    );

    return response.body;
  },
});
