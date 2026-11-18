import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import { forwardMessageActionOutputSchema } from '../output-schemas';

export const telegramForwardMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'forward_message',
  classification: 'WRITE',
  displayName: 'Forward Message',
  description: 'Forward a message from one chat to another.',
  audience: 'human',
  aiMetadata: { description: 'Forwards an existing message from a source chat (from_chat_id) to a target chat (chat_id), preserving its original sender attribution. Use to relay content the bot can access between chats. Not idempotent: each call creates a new forwarded message in the target chat.', idempotent: false },
  propertyGroups: [
    {
      key: 'source',
      display: 'section',
      label: 'Message to Forward',
      icon: 'inbox',
      props: ['from_chat_id', 'message_id'],
    },
    {
      key: 'send_to',
      display: 'section',
      label: 'Send to',
      icon: 'send',
      props: ['instructions', 'chat_id'],
    },
  ],
  props: {
    from_chat_id: Property.ShortText({
      displayName: 'From Chat ID',
      description: 'Chat the message is in, by ID or @username.',
      placeholder: '123456789 or @channelname',
      required: true,
    }),
    message_id: Property.Number({
      displayName: 'Message ID',
      description: 'ID of the message in that chat.',
      required: true,
    }),
    instructions: telegramCommons.form.chatIdInstructions(),
    chat_id: Property.ShortText({
      displayName: 'Chat ID',
      description: 'Numeric chat ID, or @username for a public channel.',
      placeholder: '123456789 or @channelname',
      required: true,
    }),
    message_thread_id: telegramCommons.form.messageThreadIdProp(),
    disable_notification: telegramCommons.form.disableNotificationProp(),
    protect_content: telegramCommons.form.protectContentProp(),
  },
  outputSchema: forwardMessageActionOutputSchema,
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
