import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const unpinChatMessage = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_unpin_chat_message',
  displayName: 'Unpin Chat Message',
  description: 'Unpins a message in a chat.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Unpins a pinned message in a chat (chat ID from List Chats) by its pinned message ID from List Pinned Chat Messages or Pin Chat Message. The message itself is kept and can be pinned again.',
    idempotent: false,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    pinnedMessageId: Property.ShortText({
      displayName: 'Pinned Message ID',
      description: 'The pinned message ID (the id field), from List Pinned Chat Messages or Pin Chat Message.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, pinnedMessageId } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`/chats/${chatId}/pinnedMessages/${pinnedMessageId}`).delete();
    return { success: true };
  },
});
