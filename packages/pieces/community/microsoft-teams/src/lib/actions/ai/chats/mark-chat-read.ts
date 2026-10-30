import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const markChatRead = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_mark_chat_read',
  displayName: 'Mark Chat Read',
  description: 'Marks a chat as read for the signed-in user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks every message in a chat (chat ID from List Chats) as read for the signed-in user only. Undo with Mark Chat Unread.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
  },
  async run(context) {
    const { chatId } = context.propsValue;
    const user = await microsoftTeamsClient.signedInUser({ auth: context.auth });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`/chats/${chatId}/markChatReadForUser`).post({ user });
    return { success: true };
  },
});
