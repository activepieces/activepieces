import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';
import { messageOutputSchema } from '../../output-schemas';

export const createClickupMessageReply = createAction({
  auth: clickupAuth,
  name: 'create_message_reply',
  classification: 'WRITE',
  description: 'Reply to a chat message in its thread.',
  audience: 'both',
  aiMetadata: { description: 'Post a reply to an existing Chat message in a ClickUp workspace, creating a threaded response under that message. Each call adds a new reply, so repeated calls create duplicates (not idempotent). Use Create Message to start a new top-level message in a channel instead.', idempotent: false },
  displayName: 'Create Message Reply',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    message_id: Property.ShortText({
      description: 'Returned by Get Channel Messages or Create Message.',
      displayName: 'Message ID',
      required: true,
    }),
    content: Property.LongText({
      description: 'ClickUp formats Markdown in the message.',
      displayName: 'Message',
      required: true,
      placeholder: 'e.g. The release is live',
    }),
    type: Property.StaticDropdown({
      description: 'How the reply appears in the thread.',
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
