import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { chatbaseAuth } from '../../index';

export const createChatbotAction = createAction({
  auth: chatbaseAuth,
  name: 'create_chatbot',
  displayName: 'Create Chatbot',
  description: 'Create a new chatbot in Chatbase.',
  props: {
    chatbotName: Property.ShortText({
      displayName: 'Chatbot Name',
      required: true,
    }),
    sourceText: Property.LongText({
      displayName: 'Source Text',
      description: 'Optional text data for training the chatbot.',
      required: false,
    }),
  },
  async run(context) {
    const { chatbotName, sourceText } = context.propsValue;
    const apiKey = context.auth as string;

    const body: Record<string, unknown> = {
      chatbotName,
    };

    if (sourceText) {
      body['sourceText'] = sourceText;
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/create-chatbot',
      body
    );

    return response;
  },
});
