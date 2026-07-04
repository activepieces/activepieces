import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chatlingAuth } from '../auth';
import { makeRequest } from '../common';
import { templateIdDropdown } from '../common/props';

export const createChatbot = createAction({
  auth: chatlingAuth,
  name: 'create_chatbot',
  displayName: 'Create Chatbot',
  description: 'Create a new chatbot using a template or from scratch.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new Chatling chatbot in the account, either seeded from an existing template or built from scratch when no template is given. Use when an agent needs to provision a new bot. Requires a name; the template ID is optional. Not idempotent — each call creates a separate chatbot, even with identical input.',
    idempotent: false,
  },
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
