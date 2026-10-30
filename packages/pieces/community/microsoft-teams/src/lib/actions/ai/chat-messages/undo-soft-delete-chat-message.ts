import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsUndoSoftDeleteChatMessageOutputSchema } from '../../../output-schemas';

export const undoSoftDeleteChatMessage = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_undo_soft_delete_chat_message',
  outputSchema: microsoftTeamsUndoSoftDeleteChatMessageOutputSchema,
  displayName: 'Undo Soft Delete Chat Message',
  description: 'Restores a chat message you soft-deleted.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restores a chat message the signed-in user removed with Soft Delete Chat Message. Chat IDs come from List Chats; message IDs from List Chat Messages.',
    idempotent: false,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the soft-deleted message, from List Chat Messages or Soft Delete Chat Message.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, messageId } = context.propsValue;
    const { id: userId } = await microsoftTeamsClient.signedInUser({ auth: context.auth });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`/users/${userId}/chats/${chatId}/messages/${messageId}/undoSoftDelete`).post({});
    return { restored: true, chatId, messageId };
  },
});
