import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsUtils } from '../../../common/utils';

export const updateChatMessage = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_update_chat_message',
  displayName: 'Update Chat Message',
  description: 'Replaces the body of a chat message you sent.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the whole body of a chat message with new content; only messages the signed-in user sent can be edited. Chat IDs come from List Chats; message IDs from List Chat Messages or Post Chat Message.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of a message the signed-in user sent, from List Chat Messages or Post Chat Message.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The new message body, replacing the old one, as plain text or HTML depending on Content Type.',
      required: true,
    }),
    contentType: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'text or html.',
      required: true,
      defaultValue: 'text',
      options: {
        disabled: false,
        options: [
          { label: 'Text', value: 'text' },
          { label: 'HTML', value: 'html' },
        ],
      },
    }),
  },
  async run(context) {
    const { chatId, messageId, content, contentType } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`/chats/${chatId}/messages/${messageId}`).patch(microsoftTeamsUtils.buildMessageBody({ content, contentType, mentions: [] }));
    return { updated: true, chatId, messageId };
  },
});
