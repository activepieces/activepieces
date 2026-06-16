import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const createClickupFolderlessList = createAction({
  auth: clickupAuth,
  name: 'create_folderless_list',
  description: 'Create a new folderless list in a ClickUp workspace and space',
  audience: 'both',
  aiMetadata: { description: 'Create a new list directly under a ClickUp space (not inside a folder). Each call creates a separate list even with the same name, so it is not idempotent. Use when you need a top-level list in a space; to create a list inside a folder, use a folder-scoped list action instead.', idempotent: false },
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
