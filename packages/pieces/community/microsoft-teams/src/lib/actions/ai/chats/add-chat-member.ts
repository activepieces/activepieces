import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsHideChatOutputSchema } from '../../../output-schemas';

const ROLES = ['owner', 'guest'];

export const addChatMember = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_add_chat_member',
  displayName: 'Add Chat Member',
  description: 'Adds a user to a group chat.',
  audience: 'ai',
  outputSchema: microsoftTeamsHideChatOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a user (user ID from List Users) to a group chat (chat ID from List Chats), optionally sharing chat history from a given time. Group chats only; one-on-one and meeting chats are rejected. Use List Chat Members afterwards for the new membership ID.',
    idempotent: false,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    userId: microsoftTeamsAiProps.userId({ required: true }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'owner for members and out-of-tenant external users, guest for in-tenant guest users. Defaults to owner.',
      required: false,
      defaultValue: 'owner',
      options: {
        disabled: false,
        options: [
          { label: 'Owner', value: 'owner' },
          { label: 'Guest', value: 'guest' },
        ],
      },
    }),
    visibleHistoryStartDateTime: Property.ShortText({
      displayName: 'Share History From',
      description: 'ISO 8601 timestamp; the new member sees messages from this time on. Use 0001-01-01T00:00:00Z for the whole history. Leave empty to share no history.',
      required: false,
    }),
  },
  async run(context) {
    const { chatId, userId, visibleHistoryStartDateTime } = context.propsValue;
    const role = context.propsValue.role ?? 'owner';
    if (!ROLES.includes(role)) {
      throw new Error(`Role must be one of: ${ROLES.join(', ')}.`);
    }
    const graphBaseUrl = microsoftTeamsClient.graphUrl({ auth: context.auth });
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`/chats/${chatId}/members`).post({
      '@odata.type': '#microsoft.graph.aadUserConversationMember',
      'user@odata.bind': `${graphBaseUrl}/v1.0/users('${userId}')`,
      roles: [role],
      ...(visibleHistoryStartDateTime ? { visibleHistoryStartDateTime } : {}),
    });
    return { success: true };
  },
});
