import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { missiveAuth } from '../../';

export const newMessageTrigger = createTrigger({
  auth: missiveAuth,
  name: 'new_message',
  displayName: 'New Message',
  description: 'Fires when a new message (email, SMS, chat) is received',
  props: {
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'Filter messages by specific conversation ID (optional)',
      required: false,
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'msg_123',
    subject: 'Test Message',
    body: 'This is a test message',
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    conversation_id: 'conv_123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  onEnable: async (context) => {
    // Set up webhook for new messages
    context.app.createListeners({
      events: ['message.created'],
      identifierValue: context.auth.apiToken,
    });
  },
  onDisable: async () => {
    // Clean up webhook
  },
  run: async (context) => {
    const payloadBody = context.payload.body as Record<string, unknown>;
    
    // Filter by conversation ID if specified
    if (context.propsValue.conversationId && 
        payloadBody.conversation_id !== context.propsValue.conversationId) {
      return [];
    }

    return [payloadBody];
  },
}); 