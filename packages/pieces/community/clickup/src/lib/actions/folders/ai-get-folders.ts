import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetFolders = createAction({
  auth: clickupAuth,
  name: 'clickup_get_folders',
  description: 'List all folders in a ClickUp space',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read-only: list every folder in a ClickUp space, returning their IDs and names. Use to discover folder IDs before acting on a folder or creating a list inside one. Safe to call repeatedly.',
    idempotent: true,
  },
  displayName: 'Get Folders',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
  },
  async run(configValue) {
    const { space_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `space/${space_id}/folder`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
