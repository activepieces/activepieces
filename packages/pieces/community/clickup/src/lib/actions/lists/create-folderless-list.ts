import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../../';

export const createClickupFolderlessList = createAction({
  auth: clickupAuth,
  name: 'create_folderless_list',
  description: 'Create a new folderless list in a ClickUp workspace and space',
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
