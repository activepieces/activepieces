import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramForwardMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'forward_message',
  displayName: 'Forward Message',
  description: 'Forward a message from one chat to another',
  audience: 'both',
  aiMetadata: { description: 'Forwards an existing message from a source chat (from_chat_id) to a target chat (chat_id), preserving its original sender attribution. Use to relay content the bot can access between chats. Not idempotent: each call creates a new forwarded message in the target chat.', idempotent: false },
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: Property.ShortText({
      displayName: 'Target Chat Id',
      description: 'Chat the message will be forwarded to.',
      required: true,
    }),
    from_chat_id: Property.ShortText({
      displayName: 'From Chat Id',
      description: 'Chat the original message came from.',
      required: true,
    }),
    message_id: Property.Number({
      displayName: 'Message Id',
      description: 'Identifier of the message to forward.',
      required: true,
    }),
    message_thread_id: telegramCommons.messageThreadIdProp(),
    disable_notification: telegramCommons.disableNotificationProp(),
    protect_content: telegramCommons.protectContentProp(),
  },
  async run(ctx) {
    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'forwardMessage'),
      body: {
        chat_id: ctx.propsValue.chat_id,
        from_chat_id: ctx.propsValue.from_chat_id,
        message_id: ctx.propsValue.message_id,
        message_thread_id: ctx.propsValue.message_thread_id ?? undefined,
        disable_notification: ctx.propsValue.disable_notification ?? false,
        protect_content: ctx.propsValue.protect_content ?? false,
      },
    });
  },
});
