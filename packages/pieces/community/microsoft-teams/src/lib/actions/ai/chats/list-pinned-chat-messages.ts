import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const listPinnedChatMessages = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_pinned_chat_messages',
  displayName: 'List Pinned Chat Messages',
  description: 'Lists the pinned messages of a chat.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the pinned messages of a chat (chat ID from List Chats), each with its pinned message ID and the full message. The pinned message ID feeds Unpin Chat Message.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
  },
  async run(context) {
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() =>
      client.api(`/chats/${context.propsValue.chatId}/pinnedMessages`).expand('message').get(),
    );
  },
});
