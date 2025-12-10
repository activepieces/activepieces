import { createAction, Property } from '@activepieces/pieces-framework';
import { chatnodeAuth } from '../common/auth';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from '../common/constants';

export const askChatbotAction = createAction({
  name: 'ask-chatbot',
  auth: chatnodeAuth,
  displayName: 'Ask Chatbot',
  description: 'Sends a message to your bot and get back an answer.',
  props: {
    botId: Property.ShortText({
      displayName: 'Bot ID',
      required: true,
      description: "You can obtain Bot ID from bot's settings menu.",
    }),
    message: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
    chatSessionId: Property.ShortText({
      displayName: 'Chat Session ID',
      description:
        'The chat session id to keep track of a unique conversation. If not provided, it will default to generate a new one each time.You can obtain it from URL after /chats/.',
      required: false,
    }),
  },
  async run(context) {
    const { botId, message, chatSessionId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: BASE_URL + `/${botId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      body: {
        message,
        chat_session_id: chatSessionId,
      },
    });

    return response.body;
  },
});
