import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsCreateChatOutputSchema } from '../../../output-schemas';

const CHAT_TYPES = ['oneOnOne', 'group'];

export const createChat = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_create_chat',
  outputSchema: microsoftTeamsCreateChatOutputSchema,
  displayName: 'Create Chat',
  description: 'Creates a one-on-one or group chat with the signed-in user and other users.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a chat between the signed-in user (added automatically) and other users by user ID from List Users: oneOnOne takes exactly one other user, group takes two or more and an optional topic. Creating a oneOnOne chat that already exists returns the existing chat. Send messages to it with Post Chat Message.',
    idempotent: false,
  },
  props: {
    chatType: Property.StaticDropdown({
      displayName: 'Chat Type',
      description: 'oneOnOne for a chat with exactly one other user, group for two or more other users.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'One-on-one', value: 'oneOnOne' },
          { label: 'Group', value: 'group' },
        ],
      },
    }),
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'The other users to add, by user ID or user principal name, from List Users. Do not include the signed-in user.',
      required: true,
    }),
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'The chat title. Group chats only; at most 250 characters, no colons.',
      required: false,
    }),
  },
  async run(context) {
    const { chatType, topic } = context.propsValue;
    const userIds = context.propsValue.userIds.map((id) => String(id));
    if (!CHAT_TYPES.includes(chatType)) {
      throw new Error(`Chat Type must be one of: ${CHAT_TYPES.join(', ')}.`);
    }
    if (chatType === 'oneOnOne' && userIds.length !== 1) {
      throw new Error('User IDs must contain exactly one user for a oneOnOne chat.');
    }
    if (chatType === 'group' && userIds.length < 2) {
      throw new Error('User IDs must contain at least two users for a group chat.');
    }
    if (chatType === 'oneOnOne' && topic) {
      throw new Error('Topic can only be set for a group chat.');
    }
    const me = await microsoftTeamsClient.signedInUser({ auth: context.auth });
    const graphBaseUrl = microsoftTeamsClient.graphUrl({ auth: context.auth });
    const members = [me.id, ...userIds].map((id) => ({
      '@odata.type': '#microsoft.graph.aadUserConversationMember',
      roles: ['owner'],
      'user@odata.bind': `${graphBaseUrl}/v1.0/users('${id}')`,
    }));
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await client.api('/chats').post({
      chatType,
      members,
      ...(topic ? { topic } : {}),
    });
  },
});
