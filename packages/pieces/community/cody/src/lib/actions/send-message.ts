import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { makeRequest, Message } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendMessageAction = createAction({
  auth: codyAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send your message and receive the AI-generated response',
  props: {
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      required: true,
      description: 'The ID of the conversation to send the message to',
    }),
    message: Property.LongText({
      displayName: 'Message',
      required: true,
      description: 'The message content to send',
    }),
    context_documents: Property.Array({
      displayName: 'Context Documents',
      required: false,
      description: 'Optional array of document IDs to provide context',
    }),
  },
  async run(context) {
    const { conversation_id, message, context_documents } = context.propsValue;

    const response = await makeRequest<{ user_message: Message; bot_response: Message }>(
      HttpMethod.POST,
      `/conversations/${conversation_id}/messages`,
      context.auth,
      {
        content: message,
        context_documents: context_documents || [],
      }
    );

    if (!response.success) {
      throw new Error(`Failed to send message: ${response.error}`);
    }

    return {
      user_message: response.data.user_message,
      bot_response: response.data.bot_response,
      conversation_id,
    };
  },
});