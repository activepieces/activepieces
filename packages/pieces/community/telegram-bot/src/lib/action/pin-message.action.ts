import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramPinMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'pin_message',
  displayName: 'Pin Message',
  description: 'Pin a message in a chat. The bot must be an administrator in the chat for this to work.',
  audience: 'both',
  aiMetadata: { description: 'Pins an existing message in a chat, identified by chat_id and message_id; the bot must be an administrator with pin rights. Use to highlight an announcement or important message. Idempotent: pinning an already-pinned message leaves it pinned with the same result.', idempotent: true },
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_id: Property.Number({
      displayName: 'Message Id',
      description: 'Identifier of the message to pin.',
      required: true,
    }),
    disable_notification: Property.Checkbox({
      displayName: 'Disable Notification',
      description: 'Pass True if it is not necessary to send a notification to all chat members.',
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
