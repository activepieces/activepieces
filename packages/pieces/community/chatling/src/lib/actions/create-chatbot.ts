import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chatlingAuth } from '../../index';
import { makeRequest } from '../common';
import { templateIdDropdown } from '../common/props';

export const createChatbot = createAction({
  auth: chatlingAuth,
  name: 'create_chatbot',
  displayName: 'Create Chatbot',
  description: 'Create a new chatbot using a template or from scratch.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the chatbot',
      required: true,
    }),
    template_id: templateIdDropdown,
  },

  async run(context) {
    const { name, template_id } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const body: Record<string, unknown> = { name };

    if (template_id) body['template_id'] = template_id;

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/chatbots',
      body
    );

    return response;
  },
});
