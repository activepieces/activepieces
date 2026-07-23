import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramUnpinMessage = createAction({
  auth: telegramBotAuth,
  name: 'telegram_unpin_message',
  displayName: 'Unpin Message',
  description: 'Unpin a message in a Telegram chat.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Unpins a message in a chat addressed by chat_id (a numeric id or @channelusername the bot can reach) — supply message_id to unpin a specific message, or omit it to unpin the most recent pinned message; the bot must be an administrator with pin rights. Use to clear a pin set by telegram_pin_message. Idempotent: an already-unpinned message stays unpinned.',
    idempotent: true,
  },
  props: {
    chat_id: telegramCommons.chatIdProp(),
    message_id: Property.ShortText({
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
