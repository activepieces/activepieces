import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../../';

export const createClickupMessage = createAction({
  auth: clickupAuth,
  name: 'create_message',
  description: 'Creates a message in a ClickUp channel',
  displayName: 'Create Message',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    channel_id: clickupCommon.channel_id(),
    content: Property.LongText({
      description: 'Content of the message',
      displayName: 'Message Content',
      required: true,
    }),
    type: Property.StaticDropdown({
      description: 'Type of the message',
      displayName: 'Message Type',
      required: true,
      options: {
        options: [
          { label: 'Message', value: 'message' },
          { label: 'Post', value: 'post' },
        ],
      },
      defaultValue: 'message',
    }),
  },

  async run(configValue) {
    const { workspace_id, channel_id, content, type } = configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.POST,
      `workspaces/${workspace_id}/chat/channels/${channel_id}/messages`,
      getAccessTokenOrThrow(configValue.auth),
      {
        content,
        type,
      },
      {}
    );
    return response.body;
  },
});
