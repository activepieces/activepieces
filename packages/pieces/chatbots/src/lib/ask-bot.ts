import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { SeekPage } from '@activepieces/shared';

export const askBot = createAction({
  name: 'ask',
  auth: PieceAuth.None(),
  displayName: 'Ask Bot',
  description: 'Ask bot a question',
  props: {
    chatbot_id: Property.Dropdown({
      displayName: 'Chatbots',
      required: true,
      refreshers: [],
      options: async (ctx, { server }) => {
        
    
        const response = await httpClient.sendRequest<
          SeekPage<{
            id: string;
            displayName: string;
          }>
        >({
          method: HttpMethod.GET,
          url: server.apiUrl + 'v1/chatbots',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: server.token,
          },
        });
        return {
          options: response.body.data.map(
            (chatbot: { id: string; displayName: string }) => ({
              value: chatbot.id,
              label: chatbot.displayName,
            })
          ),
          disabled: false,
        };
      },
    }),
    input: Property.ShortText({
      displayName: 'Input',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest<{ output: string }>({
      method: HttpMethod.POST,
      url:
        context.server.apiUrl +
        'v1/chatbots/' +
        context.propsValue.chatbot_id +
        '/ask',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
      body: {
        input: context.propsValue.input,
      },
    });
    return response.body.output;
  },
});
