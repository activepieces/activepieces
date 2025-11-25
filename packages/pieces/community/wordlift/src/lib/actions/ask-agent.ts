import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { wordliftAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';

export const askAgent = createAction({
  auth: wordliftAuth,
  name: 'askAgent',
  displayName: 'Ask Agent',
  description: 'Ask a question to the Wordlift agent',
  props: {
    message: Property.ShortText({
      displayName: 'Message',
      description: 'The message to send to the Wordlift agent',
      required: true,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'The AI model to use for the response',
      required: false,
      defaultValue: 'gpt-4o',
    }),
    security: Property.Checkbox({
      displayName: 'Security',
      description: 'Enable security features',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { message, model, security } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: '/ask',
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        message,
        model,
        security,
      },
    });

    return response.body;
  },
});
