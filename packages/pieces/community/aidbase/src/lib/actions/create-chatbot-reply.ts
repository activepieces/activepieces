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

    return await aidbaseClient.createChatbotReply(apiKey, chatbot_id, {
      message,
      session_id,
    });
  },
});
