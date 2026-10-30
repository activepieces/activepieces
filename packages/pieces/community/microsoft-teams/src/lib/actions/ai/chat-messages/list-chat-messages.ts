import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export const listChatMessages = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_chat_messages',
  displayName: 'List Chat Messages',
  description: 'Lists the messages in a chat, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the messages of one chat, most recently modified first, one page at a time; pass @odata.nextLink back as Next Page Link for the next page. Chat IDs come from List Chats.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    limit: microsoftTeamsAiProps.limit({ max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT }),
    nextLink: microsoftTeamsAiProps.nextLink(),
  },
  async run(context) {
    const { chatId, limit, nextLink } = context.propsValue;
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: `/chats/${chatId}/messages`,
      page: { limit, max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT },
      nextLink,
    });
  },
});
