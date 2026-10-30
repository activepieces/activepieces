import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const getChatMessageById = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_chat_message_by_id',
  displayName: 'Get Chat Message by ID',
  description: 'Gets one message in a chat by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one chat message by chat ID and message ID, with its body, sender, mentions, reactions, attachments and edit or delete state. Chat IDs come from List Chats; message IDs from List Chat Messages or Post Chat Message.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The message ID, from List Chat Messages or Post Chat Message.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, messageId } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api(`/chats/${chatId}/messages/${messageId}`).get());
  },
});
