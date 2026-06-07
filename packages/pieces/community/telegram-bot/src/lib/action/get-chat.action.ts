import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramGetChatAction = createAction({
  auth: telegramBotAuth,
  name: 'get_chat',
  displayName: 'Get Chat',
  description: 'Get up-to-date information about a chat (name, description, photo, member count, etc.)',
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
  },
  async run(ctx) {
    try {
      const response = await httpClient.sendRequest<never>({
        method: HttpMethod.POST,
        url: telegramCommons.getApiUrl(ctx.auth, 'getChat'),
        body: {
          chat_id: ctx.propsValue.chat_id,
        },
      });
      return response.body;
    } catch (error) {
      return (error as HttpError).errorMessage().response.body;
    }
  },
});
