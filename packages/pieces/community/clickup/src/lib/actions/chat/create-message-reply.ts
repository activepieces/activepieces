import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../../';

export const createClickupMessageReply = createAction({
  auth: clickupAuth,
  name: 'create_message_reply',
  description: 'Creates a reply to a message in a ClickUp channel',
  displayName: 'Create Message Reply',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    message_id: Property.ShortText({
      description: 'ID of the message to reply to',
      displayName: 'Message ID',
      required: true,
    }),
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
    const { workspace_id, message_id, content, type } = configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.POST,
      `workspaces/${workspace_id}/chat/messages/${message_id}/replies`,
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
