import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupCreateFolderlessList = createAction({
  auth: clickupAuth,
  name: 'clickup_create_folderless_list',
  description: 'Create a new list directly under a ClickUp space',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new list directly under a ClickUp space, not inside a folder. Pick this for a top-level list in a space; use Create List (in Folder) when the list belongs to a folder. Each call creates a new list even with the same name, so retries duplicate it.',
    idempotent: false,
  },
  displayName: 'Create Folderless List',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    name: Property.ShortText({
      description: 'The name of the list to create',
      displayName: 'List Name',
      required: true,
    }),
  },
  async run(configValue) {
    const { space_id, name } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.POST,
      `space/${space_id}/list`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name,
      }
    );

    return response.body;
  },
});
