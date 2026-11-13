import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListChannelMessageHostedContentsOutputSchema } from '../../../output-schemas';

export const listChatMessageHostedContents = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_chat_message_hosted_contents',
  outputSchema: microsoftTeamsListChannelMessageHostedContentsOutputSchema,
  displayName: 'List Chat Message Hosted Contents',
  description: 'Lists the images and code snippets hosted inside a chat message.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the hosted contents (inline images, code snippets) of one chat message, without their bytes; read the bytes with Get Chat Message Hosted Content. Chat IDs come from List Chats; message IDs from List Chat Messages.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The message ID, from List Chat Messages or Get Chat Message by ID.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, messageId } = context.propsValue;
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: `/chats/${chatId}/messages/${messageId}/hostedContents`,
    });
  },
});
