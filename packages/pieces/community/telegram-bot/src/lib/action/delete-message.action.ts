import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramDeleteMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'delete_message',
  displayName: 'Delete Message',
  description: 'Delete a message sent in a chat. Bots can delete their own messages and messages in groups where they are admins.',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes a message from a chat, identified by chat_id and message_id. Use to clean up or retract content; the bot can only delete its own messages or any message in groups where it is an administrator. Idempotent in effect: the message ends up deleted regardless of how many times this runs with the same input.', idempotent: true },
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_id: Property.Number({
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
