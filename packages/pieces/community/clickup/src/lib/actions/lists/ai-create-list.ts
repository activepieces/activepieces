import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupCreateList = createAction({
  auth: clickupAuth,
  name: 'clickup_create_list',
  description: 'Create a new list inside a ClickUp folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new list inside a specific ClickUp folder. Pick this when the list should live under a folder; use Create Folderless List when it should sit directly under a space. Each call creates a new list even with the same name, so retries duplicate it.',
    idempotent: false,
  },
  displayName: 'Create List (in Folder)',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    folder_id: clickupCommon.folder_id(true),
    name: Property.ShortText({
      description: 'The name of the list to create',
      displayName: 'List Name',
      required: true,
    }),
    content: Property.LongText({
      description: 'Optional description/content for the list',
      displayName: 'Content',
      required: false,
    }),
  },
  async run(configValue) {
    const { folder_id, name, content } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.POST,
      `folder/${folder_id}/list`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name,
        content,
      }
    );

    return response.body;
  },
});
