import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';
import { channelOutputSchema } from '../../output-schemas';

export const createClickupChannelInSpaceFolderOrList = createAction({
  auth: clickupAuth,
  name: 'create_channel_in_space_folder_list',
  classification: 'WRITE',
  description: 'Create a chat channel attached to a space, folder or list.',
  audience: 'both',
  aiMetadata: { description: 'Create a Chat channel attached to a specific location (space, folder, or list) in a ClickUp workspace, set via the location type and ID. Each call creates a new channel, so it is not idempotent. Use this variant when the channel should be tied to a location; use Create Channel for a standalone workspace channel.', idempotent: false },
  displayName: 'Create Channel in Space/Folder/List',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    description: Property.ShortText({
      description: 'What the channel is for.',
      displayName: 'Description',
      required: false,
      defaultValue: '',
      width: 'half',
    }),
    topic: Property.ShortText({
      description: 'A short line shown at the top of the channel.',
      displayName: 'Topic',
      required: false,
      defaultValue: '',
      width: 'half',
    }),
    locationType: Property.StaticDropdown({
      description: 'What the channel belongs to.',
      displayName: 'Attach To',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'Space', value: 'space' },
          { label: 'Folder', value: 'folder' },
          { label: 'List', value: 'list' },
        ],
      },
      defaultValue: 'folder',
    }),
    locationId: Property.ShortText({
      description: 'The number at the end of the space, folder or list URL.',
      displayName: 'Location ID',
      required: true,
      placeholder: 'e.g. 901204567890',
    }),
    visibility: Property.StaticDropdown({
      description: 'Who can see and join the channel.',
      displayName: 'Visibility',
      required: true,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Public',
            value: 'PUBLIC',
            icon: 'users',
          },
          {
            label: 'Private',
            value: 'PRIVATE',
            icon: 'user',
          },
        ],
      },
      defaultValue: 'PUBLIC',
    }),
  },
  propertyGroups: [
    {
      key: 'location',
      display: 'section',
      label: 'Location',
      icon: 'inbox',
      props: ['workspace_id', 'locationType', 'locationId'],
    },
    {
      key: 'channel',
      display: 'section',
      label: 'Channel',
      icon: 'text',
      props: ['description', 'topic', 'visibility'],
    },
  ],

  outputSchema: channelOutputSchema,
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
