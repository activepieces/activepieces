import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

const EXPAND_OPTIONS = ['members', 'lastMessagePreview'];

export const getChat = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_chat',
  displayName: 'Get Chat',
  description: 'Gets one chat by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one chat the signed-in user is in by its chat ID (from List Chats), with its topic, type, timestamps and web URL. Optionally include its members or a preview of its last message in the same call.',
    idempotent: true,
  },
  props: {
    chatId: microsoftTeamsAiProps.chatId({ required: true }),
    include: Property.StaticDropdown({
      displayName: 'Include',
      description: 'Extra data to include: the chat members or a preview of the last message. Leave empty for the chat only.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Members', value: 'members' },
          { label: 'Last Message Preview', value: 'lastMessagePreview' },
        ],
      },
    }),
  },
  async run(context) {
    const { chatId, include } = context.propsValue;
    if (include && !EXPAND_OPTIONS.includes(include)) {
      throw new Error(`Include must be one of: ${EXPAND_OPTIONS.join(', ')}.`);
    }
    const client = microsoftTeamsClient.create({ auth: context.auth });
    const request = include ? client.api(`/chats/${chatId}`).expand(include) : client.api(`/chats/${chatId}`);
    return await microsoftTeamsClient.withRetry(() => request.get());
  },
});
