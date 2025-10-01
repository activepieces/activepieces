import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { SendMessageDto } from '../common/types';

export const sendMessage = createAction({
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send a message to a chatbot',
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      description: 'ID of the chatbot',
      required: true,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'ID of the conversation',
      required: false,
    }),
    sender: Property.StaticDropdown({
      displayName: 'Sender',
      description: 'Who is sending the message',
      required: true,
      options: {
        options: [
          { label: 'User', value: 'user' },
          { label: 'Bot', value: 'bot' },
          { label: 'System', value: 'system' },
        ],
      },
    }),
    text: Property.LongText({
      displayName: 'Message Text',
      description: 'The message content',
      required: true,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional metadata for the message',
      required: false,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth);

    const payload = SendMessageDto.parse({
      conversationId: context.propsValue.conversationId,
      sender: context.propsValue.sender,
      text: context.propsValue.text,
      metadata: context.propsValue.metadata,
    });

    return await client.sendMessage(context.propsValue.chatbotId, payload);
  },
});
