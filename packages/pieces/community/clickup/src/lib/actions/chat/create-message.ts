import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';

export const createClickupMessage = createAction({
  auth: clickupAuth,
  name: 'create_message',
  description: 'Creates a message in a ClickUp channel',
  audience: 'both',
  aiMetadata: { description: 'Post a new top-level message into a ClickUp Chat channel, given the workspace and channel IDs. Each call sends a separate message, so repeated calls create duplicates (not idempotent). Use Create Message Reply to respond within an existing message thread instead.', idempotent: false },
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
