import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const updateChat = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_update_chat',
  displayName: 'Update Chat',
  description: 'Renames a group chat.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the topic (title) of a group chat by chat ID from List Chats. Only group chats have a topic; one-on-one and meeting chats are rejected.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'The new chat title, at most 250 characters, no colons.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, topic } = context.propsValue;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await client.api(`/chats/${chatId}`).patch({ topic });
  },
});
