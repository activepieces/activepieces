import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsGetChatMessageHostedContentOutputSchema } from '../../../output-schemas';

export const getChatMessageHostedContent = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_chat_message_hosted_content',
  outputSchema: microsoftTeamsGetChatMessageHostedContentOutputSchema,
  displayName: 'Get Chat Message Hosted Content',
  description: 'Downloads one hosted content of a chat message as base64.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads the bytes of one hosted content (an inline image or code snippet) of a chat message, base64-encoded. Chat IDs come from List Chats; message IDs from List Chat Messages; hosted content IDs from List Chat Message Hosted Contents.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The message ID, from List Chat Messages or Get Chat Message by ID.',
      required: true,
    }),
    hostedContentId: Property.ShortText({
      displayName: 'Hosted Content ID',
      description: 'The hosted content ID, from List Chat Message Hosted Contents.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, messageId, hostedContentId } = context.propsValue;
    const contentBase64 = await microsoftTeamsClient.getBase64({
      auth: context.auth,
      path: `/chats/${chatId}/messages/${messageId}/hostedContents/${hostedContentId}/$value`,
    });
    return { id: hostedContentId, chatId, messageId, contentBase64 };
  },
});
