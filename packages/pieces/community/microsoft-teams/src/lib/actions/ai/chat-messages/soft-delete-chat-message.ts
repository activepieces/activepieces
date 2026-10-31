import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsSoftDeleteChatMessageOutputSchema } from '../../../output-schemas';

export const softDeleteChatMessage = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_soft_delete_chat_message',
  outputSchema: microsoftTeamsSoftDeleteChatMessageOutputSchema,
  displayName: 'Soft Delete Chat Message',
  description: 'Deletes a chat message you sent; it can be restored.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Soft-deletes a chat message the signed-in user sent; it stays recoverable with Undo Soft Delete Chat Message. Chat IDs come from List Chats; message IDs from List Chat Messages or Post Chat Message.',
    idempotent: false,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of a message the signed-in user sent, from List Chat Messages or Post Chat Message.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, messageId } = context.propsValue;
    const { id: userId } = await microsoftTeamsClient.signedInUser({ auth: context.auth });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`/users/${userId}/chats/${chatId}/messages/${messageId}/softDelete`).post({});
    return { softDeleted: true, chatId, messageId };
  },
});
