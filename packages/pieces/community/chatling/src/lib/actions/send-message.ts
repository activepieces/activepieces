import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chatlingAuth } from '../../index';
import { makeRequest } from '../common';
import {
  chatbotIdDropdown,
  aiModelIdDropdown,
  languageIdDropdown,
  contactIdDropdown,
  conversationIdDropdown,
} from '../common/props';

export const sendMessage = createAction({
  auth: chatlingAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send a message to the chatbot and receive an AI response.',
  props: {
    chatbotId: chatbotIdDropdown,
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to send to the AI',
      required: true,
    }),
    ai_model_id: aiModelIdDropdown,
    conversation_id: conversationIdDropdown,
    contact_id: contactIdDropdown,
    language_id: languageIdDropdown,
    temperature: Property.Number({
      displayName: 'Temperature',
      description:
        'Controls randomness (0 = focused, 1 = creative). Default is 0.',
      required: false,
      defaultValue: 0,
    }),
    instructions: Property.Array({
      displayName: 'Instructions',
      description: 'Additional instructions to tailor the AI response',
      required: false,
    }),
  },

  async run(context) {
    const {
      chatbotId,
      message,
      ai_model_id,
      conversation_id,
      contact_id,
      language_id,
      temperature,
      instructions,
    } = context.propsValue;

    const apiKey = context.auth.secret_text;

    const body: Record<string, unknown> = {
      message,
      ai_model_id,
    };

    if (conversation_id) body['conversation_id'] = conversation_id;
    if (contact_id) body['contact_id'] = contact_id;
    if (language_id) body['language_id'] = language_id;
    if (temperature !== undefined && temperature !== null)
      body['temperature'] = temperature;
    if (instructions && instructions.length > 0)
      body['instructions'] = instructions;

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/chatbots/${chatbotId}/ai/kb/chat`,
      body
    );

    return response;
  },
});

