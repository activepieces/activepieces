import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export const createClickupChannelInSpaceFolderOrList = createAction({
  auth: clickupAuth,
  name: 'create_channel_in_space_folder_list',
  description:
    'Creates a channel in a ClickUp workspace in a space, folder or list',
  audience: 'both',
  aiMetadata: { description: 'Create a Chat channel attached to a specific location (space, folder, or list) in a ClickUp workspace, set via the location type and ID. Each call creates a new channel, so it is not idempotent. Use this variant when the channel should be tied to a location; use Create Channel for a standalone workspace channel.', idempotent: false },
  displayName: 'Create Channel in Space/Folder/List',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    description: Property.ShortText({
      description: 'Description of the channel',
      displayName: 'Channel Description',
      required: false,
      defaultValue: '',
    }),
    topic: Property.ShortText({
      description: 'Topic of the channel',
      displayName: 'Channel Topic',
      required: false,
      defaultValue: '',
    }),
    locationType: Property.StaticDropdown({
      description: 'Type of location',
      displayName: 'Location Type',
      required: true,
      options: {
        options: [
          { label: 'Folder', value: 'folder' },
          { label: 'Space', value: 'space' },
          { label: 'List', value: 'list' },
        ],
      },
      defaultValue: 'folder',
    }),
    locationId: Property.ShortText({
      description: 'ID of the location',
      displayName: 'Location ID',
      required: true,
    }),
    // TODO: add user ids
    visibility: Property.StaticDropdown({
      description: 'Visibility of the channel',
      displayName: 'Channel Visibility',
      required: true,
      options: {
        options: [
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Private', value: 'PRIVATE' },
        ],
      },
      defaultValue: 'public',
    }),
  },

  async run(configValue) {
    const { workspace_id, description, visibility, locationType, locationId,topic } =
      configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.POST,
      `workspaces/${workspace_id}/chat/channels/location`,
      getAccessTokenOrThrow(configValue.auth),
      {
        topic,
        description,
        visibility,
        location: {
          id: locationId,
          type: locationType,
        },
      },
      {}
    );
    return response.body;
  },
});
