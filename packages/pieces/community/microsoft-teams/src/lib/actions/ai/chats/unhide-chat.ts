import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const unhideChat = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_unhide_chat',
  displayName: 'Unhide Chat',
  description: 'Unhides a chat for the signed-in user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Shows a chat hidden with Hide Chat in the signed-in user's chat list again, by chat ID from List Chats. Only affects the signed-in user.",
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
  },
  async run(context) {
    const { chatId } = context.propsValue;
    const user = await microsoftTeamsClient.signedInUser({ auth: context.auth });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`/chats/${chatId}/unhideForUser`).post({ user });
    return { success: true };
  },
});
