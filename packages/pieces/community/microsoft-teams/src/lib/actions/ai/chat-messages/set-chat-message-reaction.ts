import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const setChatMessageReaction = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_set_chat_message_reaction',
  displayName: 'Set Chat Message Reaction',
  description: "Adds the signed-in user's reaction to a chat message.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Adds the signed-in user's emoji reaction to a chat message; remove it with Unset Chat Message Reaction. Chat IDs come from List Chats; message IDs from List Chat Messages or Post Chat Message.",
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
    await client.api(`/chats/${chatId}/messages/${messageId}/setReaction`).post({ reactionType });
    return { reactionSet: true, chatId, messageId, reactionType };
  },
});
