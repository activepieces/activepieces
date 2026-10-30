import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const getChatMember = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_chat_member',
  displayName: 'Get Chat Member',
  description: 'Gets one membership of a chat by its membership ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one chat membership by chat ID (from List Chats) and membership ID (from List Chat Members), with the user ID, display name, email, roles and visible history start. Membership IDs are not user IDs.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    membershipId: Property.ShortText({
      displayName: 'Membership ID',
      description: 'The membership ID (the id field), from List Chat Members.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, membershipId } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api(`/chats/${chatId}/members/${membershipId}`).get());
  },
});
