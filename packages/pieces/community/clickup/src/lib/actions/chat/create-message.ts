import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';
import { messageOutputSchema } from '../../output-schemas';

export const createClickupMessage = createAction({
  auth: clickupAuth,
  name: 'create_message',
  classification: 'WRITE',
  description: 'Post a message in a ClickUp chat channel.',
  audience: 'both',
  aiMetadata: { description: 'Post a new top-level message into a ClickUp Chat channel, given the workspace and channel IDs. Each call sends a separate message, so repeated calls create duplicates (not idempotent). Use Create Message Reply to respond within an existing message thread instead.', idempotent: false },
  displayName: 'Create Message',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    channel_id: clickupCommon.channel_id(true),
    content: Property.LongText({
      description: 'ClickUp formats Markdown in the message.',
      displayName: 'Message',
      required: true,
      placeholder: 'e.g. The release is live',
    }),
    type: Property.StaticDropdown({
      description: 'How the message appears in the channel.',
      displayName: 'Message Type',
      required: true,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Message',
            value: 'message',
            icon: 'text',
          },
          {
            label: 'Post',
            value: 'post',
            icon: 'send',
          },
        ],
      },
      defaultValue: 'message',
    }),
  },

  outputSchema: messageOutputSchema,
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
