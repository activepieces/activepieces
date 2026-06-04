import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { telegramBotAuth } from '../..';
import { telegramCommons } from '../common';

export const telegramGetChatMemberAction = createAction({
  auth: telegramBotAuth,
  name: 'get_chat_member',
  description: 'Get member info (or null) for the provided chat id and user id',
  displayName: 'Get Chat Member',
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    user_id: Property.ShortText({
      displayName: 'User Id',
      description: 'Unique identifier for the user',
      required: true,
    }),
  },
  async run(ctx) {
    try {
      const response = await httpClient.sendRequest<never>({
        method: HttpMethod.POST,
        url: telegramCommons.getApiUrl(ctx.auth, 'getChatMember'),
        headers: {},
        body: {
          chat_id: ctx.propsValue.chat_id,
          user_id: ctx.propsValue.user_id,
        },
      });
      return response.body;
    } catch (error) {
      return (error as HttpError).errorMessage().response.body;
    }
  },
});
