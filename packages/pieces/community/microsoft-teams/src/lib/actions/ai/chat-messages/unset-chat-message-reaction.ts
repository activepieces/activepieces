import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const unsetChatMessageReaction = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_unset_chat_message_reaction',
  displayName: 'Unset Chat Message Reaction',
  description: "Removes the signed-in user's reaction from a chat message.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Removes an emoji reaction the signed-in user added to a chat message, for example with Set Chat Message Reaction. Chat IDs come from List Chats; message IDs from List Chat Messages or Post Chat Message.",
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The message ID, from List Chat Messages or Post Chat Message.',
      required: true,
    }),
    reactionType: Property.ShortText({
      displayName: 'Reaction',
      description: 'The reaction as a unicode emoji, for example 👍, ❤️ or 😆.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, messageId, reactionType } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`/chats/${chatId}/messages/${messageId}/unsetReaction`).post({ reactionType });
    return { reactionRemoved: true, chatId, messageId, reactionType };
  },
});
