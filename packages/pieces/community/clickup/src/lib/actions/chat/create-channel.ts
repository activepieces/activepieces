import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';
import { channelOutputSchema } from '../../output-schemas';

export const createClickupChannel = createAction({
  auth: clickupAuth,
  name: 'create_channel',
  classification: 'WRITE',
  description: 'Create a chat channel in a workspace.',
  audience: 'both',
  aiMetadata: { description: 'Create a standalone Chat channel in a ClickUp workspace with a name and visibility. Each call creates a new channel, so it is not idempotent. Use this for a workspace-level channel; to tie the channel to a space, folder, or list, use Create Channel in Space/Folder/List instead.', idempotent: false },
  displayName: 'Create Channel',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    name: Property.ShortText({
      description: 'Name people see in the sidebar.',
      displayName: 'Name',
      required: true,
      defaultValue: '',
      placeholder: 'e.g. launch-team',
    }),
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
      key: 'channel',
      display: 'section',
      label: 'Channel',
      icon: 'text',
      props: ['workspace_id', 'name', 'description', 'topic', 'visibility'],
    },
  ],

  outputSchema: channelOutputSchema,
  async run(configValue) {
    const { workspace_id, name, description, visibility,topic } =
      configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.POST,
      `workspaces/${workspace_id}/chat/channels`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name,
        topic,
        description,
        visibility,
      },
      {}
    );
    return response.body;
  },
});
