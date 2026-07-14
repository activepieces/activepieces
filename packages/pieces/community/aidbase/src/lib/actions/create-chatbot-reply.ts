import { createAction, Property } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { aidbaseClient } from '../common/client';
import { chatbotDropdown } from '../common/props';

export const createChatbotReply = createAction({
  auth: aidbaseAuth,
  name: 'create_chatbot_reply',
  displayName: 'Create Chatbot Reply',
  description:
    'Generates an AI chatbot reply given a message and optional session context.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a message to a specified Aidbase chatbot and returns its AI-generated reply. Pass a session id to continue an existing conversation, or omit it to start a new one. Use to get an automated support answer for a user message; requires the chatbot id and the message text. Not idempotent: each call generates a fresh reply and advances the conversation.',
    idempotent: false,
  },

  props: {
    chatbot_id: chatbotDropdown, 
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message or question to send to the chatbot.',
      required: true,
    }),
    session_id: Property.ShortText({
      displayName: 'Session ID',
      description:
        'An optional session ID to maintain conversation context. If omitted, a new conversation will start.',
      required: false,
    }),
  },

  async run(context) {
    const { auth: apiKey, propsValue } = context; 
    const { chatbot_id, message, session_id } = propsValue;

    return await aidbaseClient.createChatbotReply(apiKey.secret_text, chatbot_id, {
      message,
      session_id,
    });
  },
});
