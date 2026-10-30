import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const listChatMembers = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_chat_members',
  displayName: 'List Chat Members',
  description: 'Lists the members of a chat.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every member of a chat (chat ID from List Chats) with their membership ID, user ID, display name, email and roles. Membership IDs feed Get Chat Member; they are not user IDs.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
  },
  async run(context) {
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: `/chats/${context.propsValue.chatId}/members`,
    });
  },
});
