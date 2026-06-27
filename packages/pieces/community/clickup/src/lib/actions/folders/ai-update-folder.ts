import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupUpdateFolder = createAction({
  auth: clickupAuth,
  name: 'clickup_update_folder',
  description: 'Rename an existing ClickUp folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rename an existing ClickUp folder by folder ID. Pick this to change a folder you already have the ID for; use Create Folder to make a new one. Re-running with the same name yields the same end state.',
    idempotent: true,
  },
  displayName: 'Update Folder',
  props: {
    folder_id: Property.ShortText({
      description: 'The ID of the folder to update',
      displayName: 'Folder ID',
      required: true,
    }),
    name: Property.ShortText({
      description: 'The new name for the folder',
      displayName: 'Folder Name',
      required: true,
    }),
  },
  async run(configValue) {
    const { folder_id, name } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.PUT,
      `folder/${folder_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name,
      }
    );

    return response.body;
  },
});
