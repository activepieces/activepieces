import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupCreateFolder = createAction({
  auth: clickupAuth,
  name: 'clickup_create_folder',
  description: 'Create a new folder in a ClickUp space',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new folder inside a ClickUp space to group lists. Pick this to add an organizational container under a space; to add a list directly, use Create Folderless List. Each call creates a new folder even with the same name, so retries duplicate it.',
    idempotent: false,
  },
  displayName: 'Create Folder',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    name: Property.ShortText({
      description: 'The name of the folder to create',
      displayName: 'Folder Name',
      required: true,
    }),
  },
  async run(configValue) {
    const { space_id, name } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.POST,
      `space/${space_id}/folder`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name,
      }
    );

    return response.body;
  },
});
