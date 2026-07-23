import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetFolder = createAction({
  auth: clickupAuth,
  name: 'clickup_get_folder',
  description: 'Get a single ClickUp folder by its ID',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read-only: fetch the details of one ClickUp folder by folder ID. Use when you already know the folder ID; to discover folder IDs first, use Get Folders. Safe to call repeatedly.',
    idempotent: true,
  },
  displayName: 'Get Folder',
  props: {
    folder_id: Property.ShortText({
      description: 'The ID of the folder to get',
      displayName: 'Folder ID',
      required: true,
    }),
  },
  async run(configValue) {
    const { folder_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `folder/${folder_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
