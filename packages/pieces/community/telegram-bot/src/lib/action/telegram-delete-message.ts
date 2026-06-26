import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramDeleteMessage = createAction({
  auth: telegramBotAuth,
  name: 'telegram_delete_message',
  displayName: 'Delete Message',
  description: 'Delete a message from a Telegram chat.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently removes a message from a chat, targeted by chat_id (a numeric id or @channelusername the bot can reach) and message_id (from a prior send action\'s return or the New Message trigger payload). Use to clean up or retract content; the bot can delete only its own messages, or any message in groups where it is an administrator. Idempotent in effect: the message ends up gone regardless of how many times this runs.',
    idempotent: true,
  },
  props: {
    chat_id: telegramCommons.chatIdProp(),
    message_id: Property.ShortText({
      displayName: 'Message Id',
      description: 'Identifier of the message to delete.',
      required: true,
    }),
  },
  async run(ctx) {
    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'deleteMessage'),
      body: {
        chat_id: ctx.propsValue.chat_id,
        message_id: ctx.propsValue.message_id,
      },
    });
  },
});
