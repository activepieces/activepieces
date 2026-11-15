import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsHideChatOutputSchema } from '../../../output-schemas';

export const markChatUnread = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_mark_chat_unread',
  outputSchema: microsoftTeamsHideChatOutputSchema,
  displayName: 'Mark Chat Unread',
  description: 'Marks a chat as unread for the signed-in user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks a chat (chat ID from List Chats) as unread for the signed-in user only: the last message by default, or every message after Last Read Time. Undo with Mark Chat Read.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    lastMessageReadDateTime: Property.ShortText({
      displayName: 'Last Read Time',
      description: 'ISO 8601 timestamp, e.g. 2024-05-01T09:00:00Z; messages sent after it become unread. Leave empty to mark only the last message unread.',
      required: false,
    }),
  },
  async run(context) {
    const { chatId, lastMessageReadDateTime } = context.propsValue;
    const user = await microsoftTeamsClient.signedInUser({ auth: context.auth });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`/chats/${chatId}/markChatUnreadForUser`).post({
      user,
      ...(lastMessageReadDateTime ? { lastMessageReadDateTime } : {}),
    });
    return { success: true };
  },
});
