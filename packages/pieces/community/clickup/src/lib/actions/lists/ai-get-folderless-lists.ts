import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetFolderlessLists = createAction({
  auth: clickupAuth,
  name: 'clickup_get_folderless_lists',
  description: 'List the folderless lists directly under a ClickUp space',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read-only: list the lists that sit directly under a ClickUp space (not inside any folder), returning their IDs and names. Use to discover top-level list IDs in a space; for lists inside a folder, use Get Folder Lists instead. Safe to call repeatedly.',
    idempotent: true,
  },
  displayName: 'Get Folderless Lists',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
  },
  async run(configValue) {
    const { space_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `space/${space_id}/list`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
