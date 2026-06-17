import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramUnpinMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'unpin_message',
  displayName: 'Unpin Message',
  description:
    'Unpin a message in a chat. Leave Message Id empty to unpin the most recent pinned message.',
  audience: 'both',
  aiMetadata: { description: 'Unpins a message in a chat; supply message_id to unpin a specific message, or leave it empty to unpin the most recent pinned message. The bot must be an administrator with pin rights. Idempotent: a message that is already unpinned stays unpinned.', idempotent: true },
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_id: Property.Number({
      displayName: 'Message Id',
      description:
        'Identifier of the pinned message to unpin. Leave empty to unpin the most recent pinned message.',
      required: false,
    }),
  },
  async run(ctx) {
    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'unpinChatMessage'),
      body: {
        chat_id: ctx.propsValue.chat_id,
        message_id: ctx.propsValue.message_id ?? undefined,
      },
    });
  },
});
