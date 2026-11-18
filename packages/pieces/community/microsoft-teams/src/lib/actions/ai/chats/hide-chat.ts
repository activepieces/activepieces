import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsHideChatOutputSchema } from '../../../output-schemas';

export const hideChat = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_hide_chat',
  outputSchema: microsoftTeamsHideChatOutputSchema,
  displayName: 'Hide Chat',
  description: 'Hides a chat for the signed-in user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Hides a chat (chat ID from List Chats) from the signed-in user's chat list, for the signed-in user only. Undo with Unhide Chat.",
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
  },
  async run(context) {
    const { chatId } = context.propsValue;
    const user = await microsoftTeamsClient.signedInUser({ auth: context.auth });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`/chats/${chatId}/hideForUser`).post({ user });
    return { success: true };
  },
});
