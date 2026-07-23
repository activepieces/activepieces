import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetFolderLists = createAction({
  auth: clickupAuth,
  name: 'clickup_get_folder_lists',
  description: 'List all lists inside a ClickUp folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read-only: list every list inside a specific ClickUp folder, returning their IDs and names. Use to discover list IDs within a folder before acting on a list; for lists that sit directly under a space, use Get Folderless Lists instead. Safe to call repeatedly.',
    idempotent: true,
  },
  displayName: 'Get Folder Lists',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    folder_id: clickupCommon.folder_id(true),
  },
  async run(configValue) {
    const { folder_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `folder/${folder_id}/list`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
