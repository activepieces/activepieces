import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { ConversationWebhookSchema, ConversationWebhook } from '../schemas';

export const newConversation = createTrigger({
  name: 'new_conversation',
  displayName: 'New Conversation',
  description: 'Fires when an existing conversation is updated with a new message',
  props: {},
  sampleData: {
    id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    object: 'event',
    event: 'conversation.updated',
    created_at: '2023-11-07T05:31:56Z',
    data: {
      conversation_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      widget_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      assistant_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      device_type: 'mobile',
      contact_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      chat_count: 5,
      transcript: [
        {
          conversation_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
          sender_type: 'user',
          message_type: 'text',
          text: 'Hello, I need help with my order',
          voice_base64: null,
          data_sources: [],
          id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
          updated_at: '2023-11-07T05:31:56Z',
          created_at: '2023-11-07T05:31:56Z',
          char_count: 30
        },
        {
          conversation_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
          sender_type: 'bot',
          message_type: 'text',
          text: 'I\'d be happy to help you with your order. Could you please provide your order number?',
          voice_base64: null,
          data_sources: null,
          id: '3c90c3cc-0d44-4b50-8888-8dd25736052b',
          updated_at: '2023-11-07T05:32:10Z',
          created_at: '2023-11-07T05:32:10Z',
          char_count: 85
        }
      ],
      attributes: {}
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Note: Insighto.ai webhooks may need to be configured manually in their dashboard
    // or they may provide webhook management APIs. For now, we'll assume manual configuration.
    // If webhook registration APIs exist, they should be implemented here.
    await context.store.put('conversation_webhook_enabled', true);
  },
  async onDisable(context) {
    // Clean up webhook configuration if needed
    await context.store.delete('conversation_webhook_enabled');
  },
  async run(context) {
    const payload = context.payload.body;

    try {
      // Validate webhook payload
      const validatedPayload = ConversationWebhookSchema.parse(payload);
      return [validatedPayload];
    } catch (error) {
      console.warn('Invalid webhook payload:', payload, error);
      return [];
    }
  },
});
