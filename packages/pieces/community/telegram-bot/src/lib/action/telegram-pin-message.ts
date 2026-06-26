import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramPinMessage = createAction({
  auth: telegramBotAuth,
  name: 'telegram_pin_message',
  displayName: 'Pin Message',
  description: 'Pin a message in a Telegram chat.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pins an existing message in a chat, targeted by chat_id (a numeric id or @channelusername the bot can reach) and message_id (from a prior send action or the New Message trigger); the bot must be an administrator with pin rights. Use to highlight an announcement or important message; to remove the pin use telegram_unpin_message. Idempotent: pinning an already-pinned message leaves it pinned.',
    idempotent: true,
  },
  props: {
    chat_id: telegramCommons.chatIdProp(),
    message_id: Property.ShortText({
      displayName: 'Message Id',
      description: 'Identifier of the message to pin.',
      required: true,
    }),
    disable_notification: Property.Checkbox({
      displayName: 'Disable Notification',
      description:
        'Pass True if it is not necessary to send a notification to all chat members.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(ctx) {
    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'pinChatMessage'),
      body: {
        chat_id: ctx.propsValue.chat_id,
        message_id: ctx.propsValue.message_id,
        disable_notification: ctx.propsValue.disable_notification ?? false,
      },
    });
  },
});
