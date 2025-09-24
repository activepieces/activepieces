import { createAction, Property } from '@activepieces/pieces-framework';
import { SiteSpeakAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { chatbotIdDropdown, conversationIdDropdown } from '../common/dropdown';

export const sendQuery = createAction({
  auth: SiteSpeakAuth,
  name: 'sendQuery',
  displayName: 'Send Query',
  description:
    'Sends a query to the specified chatbot and retrieves a response.',
  props: {
    chatbotId: chatbotIdDropdown,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The question or query text you want the chatbot to answer.',
    }),
    conversationId: conversationIdDropdown,
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      required: false,
      defaultValue: 'markdown',
      options: {
        disabled: false,
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' },
        ],
      },
      description: 'Format of the returned response; markdown or html.',
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, any> = {
      prompt: propsValue.prompt,
    };

    if (propsValue.conversationId) {
      body['conversation_id'] = propsValue.conversationId;
    }
    if (propsValue.format) {
      body['format'] = propsValue.format;
    }

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/${propsValue.chatbotId}/query`,
      body
    );
    return response;
  },
});
