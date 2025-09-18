import { createAction, Property } from '@activepieces/pieces-framework';
import { SiteSpeakAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { conversationIdDropdown } from '../common/dropdown';

export const sendQuery = createAction({
  auth: SiteSpeakAuth,
  name: 'sendQuery',
  displayName: 'Send Query',
  description: '',
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      required: true,
      description: 'The ID of the chatbot you want to query (find in your SiteSpeakAI dashboard).',
    }),
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
