import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wizychatAuth } from '../common/auth';

export const askChatbot = createAction({
  auth: wizychatAuth,
  name: 'askChatbot',
  displayName: 'Ask Chatbot',
  description: 'Send a question to a WizyChat chatbot',
  props: {
    question: Property.ShortText({
      displayName: 'Question',
      description: 'The question to ask the chatbot',
      required: true,
    }),
    session: Property.ShortText({
      displayName: 'Session ID',
      description:
        'Unique session/conversation ID for saving history (e.g., userID from your app)',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Response format',
      required: false,
      defaultValue: 'plain',
      options: {
        options: [
          { label: 'Plain Text', value: 'plain' },
          { label: 'HTML', value: 'html' },
        ],
      },
    }),
  },
  async run(context) {
    const payload: any = {
      question: context.propsValue.question,
      token: context.auth,
      format: context.propsValue.format,
      stream: "false",
    };

    if (context.propsValue.session) {
      payload.session = context.propsValue.session;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://wizy.chat/api/v1/chat',
      body: payload,
    });

    return response.body;
  },
});
