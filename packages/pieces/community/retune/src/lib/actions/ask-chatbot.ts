import { Property, createAction } from '@activepieces/pieces-framework';
import { retuneAuth } from '../../index';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const askChatbot = createAction({
  auth: retuneAuth,
  name: 'ask_chatbot',
  displayName: 'Ask Chatbot',
  description: 'Sends a message to an existing thread with a chatbot.',
  props: {
    thread: Property.Dropdown({
      displayName: 'Thread',
      description: 'The thread you want to send the message to.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const options = await httpClient.sendRequest({
          url: `https://retune.so/api/chat/${(auth as any).chatId}/threads`,
          method: HttpMethod.POST,
          headers: {
            'X-Workspace-API-Key': (auth as any).apiKey,
          },
          body: {},
        });

        return {
          options: options.body['threads'].map((item: any) => {
            return {
              label: item.name ?? item.id,
              value: item.id,
            };
          }),
        };
      },
    }),
    message: Property.ShortText({
      displayName: 'Message',
      description: 'The message you want to send.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { thread, message } = propsValue;

    const response = await httpClient.sendRequest({
      url: `https://retune.so/api/chat/${auth.chatId}/response`,
      method: HttpMethod.POST,
      headers: {
        'X-Workspace-API-Key': auth.apiKey,
      },
      body: {
        threadId: thread,
        input: message,
      },
    });

    return (response.body as any).response.value;
  },
});
