import { afforaiAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

export const askChatbotAction = createAction({
  auth: afforaiAuth,
  name: 'afforai_ask_chatbot',
  displayName: 'Ask Chatbot',
  description: 'Gets AI-generated completions for a given chatbot.',
  props: {
    sessionID: Property.ShortText({
      displayName: 'Chatbot ID',
      required: true,
      description: `You can find Chatbot ID by clicking settings button under **Actions** for given chatbot.`,
    }),
    history: Property.Array({
      displayName: 'Chat History',
      required: true,
      properties: {
        role: Property.StaticDropdown({
          displayName: 'Role',
          description: 'The role of the message sender.',
          required: true,
          options: {
            disabled: false,
            options: [
              {
                label: 'user',
                value: 'user',
              },
              {
                label: 'assistant',
                value: 'assistant',
              },
            ],
          },
        }),
        content: Property.LongText({
          displayName: 'Message',
          description: 'The content of the message.',
          required: true,
        }),
      },
    }),
    powerful: Property.Checkbox({
      displayName:
        'AI should search more deeply for information in the given files ?',
      required: true,
    }),
    google: Property.Checkbox({
      displayName: 'AI to search for information on Google?',
      required: true,
    }),
  },
  async run(context) {
    const { sessionID, powerful, google } = context.propsValue;
    const history = context.propsValue.history as ChatHistory[];

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.afforai.com/api/api_completion',
      body: {
        apiKey: context.auth,
        sessionID: sessionID,
        history: history,
        powerful: powerful,
        google: google,
      },
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});

type ChatHistory = {
  role: string;
  content: string;
};
