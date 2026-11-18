import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsUtils } from '../../../common/utils';
import { microsoftTeamsGetChatMessageByIdOutputSchema } from '../../../output-schemas';

export const postChatMessage = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_post_chat_message',
  outputSchema: microsoftTeamsGetChatMessageByIdOutputSchema,
  displayName: 'Post Chat Message',
  description: 'Sends a message in an existing chat, optionally mentioning people.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends a new message into an existing one-on-one, group or meeting chat as text or HTML; each call posts another message. To mention someone, use HTML and write <at id="N">displayName</at> in Content for the mention at index N. Chat IDs come from List Chats; user IDs from List Users.',
    idempotent: false,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The message body, as plain text or HTML depending on Content Type.',
      required: true,
    }),
    contentType: microsoftTeamsAiProps.contentType(),
    mentions: microsoftTeamsAiProps.mentions(),
  },
  async run(context) {
    const { chatId, content, contentType, mentions } = context.propsValue;
    const body = microsoftTeamsUtils.buildMessageBody({ content, contentType, mentions: mentions ?? [] });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await client.api(`/chats/${chatId}/messages`).post(body);
  },
});
