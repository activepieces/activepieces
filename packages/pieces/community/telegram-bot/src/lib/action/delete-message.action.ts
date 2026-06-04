import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramDeleteMessageAction = createAction({
  auth: telegramBotAuth,
  name: 'delete_message',
  displayName: 'Delete Message',
  description: 'Delete a message sent in a chat. Bots can delete their own messages and messages in groups where they are admins.',
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
