import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../../';
import { createAction } from '@activepieces/pieces-framework';

export const createClickupChannel = createAction({
  auth: clickupAuth,
  name: 'create_channel',
  description: 'Creates a channel in a ClickUp workspace',
  displayName: 'Create Channel',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    name: Property.ShortText({
      description: 'Name of the channel',
      displayName: 'Channel Name',
      required: true,
      defaultValue: '',
    }),
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
