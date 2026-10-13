import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import { pinMessageActionOutputSchema } from '../output-schemas';

export const telegramPinMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'pin_message',
  classification: 'WRITE',
  displayName: 'Pin Message',
  description: 'Pin a message. The bot must be an admin in the chat.',
  audience: 'human',
  aiMetadata: { description: 'Pins an existing message in a chat, identified by chat_id and message_id; the bot must be an administrator with pin rights. Use to highlight an announcement or important message. Idempotent: pinning an already-pinned message leaves it pinned with the same result.', idempotent: true },
  props: {
    instructions: telegramCommons.form.chatIdInstructions(),
    chat_id: telegramCommons.form.chatIdProp(),
    message_id: Property.Number({
      displayName: 'Message ID',
      description: telegramCommons.form.messageIdDescription,
      required: true,
    }),
    disable_notification: telegramCommons.form.disableNotificationProp({
      description: 'Pin without notifying chat members.',
    }),
  },
  outputSchema: pinMessageActionOutputSchema,
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
