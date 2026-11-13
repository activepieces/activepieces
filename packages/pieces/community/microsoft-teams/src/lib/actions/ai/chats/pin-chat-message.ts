import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsPinChatMessageOutputSchema } from '../../../output-schemas';

export const pinChatMessage = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_pin_chat_message',
  outputSchema: microsoftTeamsPinChatMessageOutputSchema,
  displayName: 'Pin Chat Message',
  description: 'Pins a message in a chat.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Pins a message (message ID from List Chat Messages) in a chat (chat ID from List Chats) and returns the pinned message ID that Unpin Chat Message takes.',
    idempotent: false,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The message ID, from List Chat Messages.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, messageId } = context.propsValue;
    const graphBaseUrl = microsoftTeamsClient.graphUrl({ auth: context.auth });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await client.api(`/chats/${chatId}/pinnedMessages`).post({
      'message@odata.bind': `${graphBaseUrl}/v1.0/chats/${chatId}/messages/${messageId}`,
    });
  },
});
