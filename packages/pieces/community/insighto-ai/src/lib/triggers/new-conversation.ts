import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ConversationWebhookSchema } from '../schemas';

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
    const webhookUrl = context.webhookUrl;
    const apiKey = context.auth as string;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.insighto.ai/api/v1/outbound_webhook',
        queryParams: { api_key: apiKey },
        body: {
          endpoint: webhookUrl,
          name: 'Activepieces Conversation Webhook',
          enabled: true,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await context.store.put('webhook_id', response.body.data?.id);
    } catch (error) {
      throw new Error(`Failed to register webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  async onDisable(context) {
    const webhookId = await context.store.get('webhook_id');
    if (!webhookId) return;

    const apiKey = context.auth as string;

    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.insighto.ai/api/v1/outbound_webhook/${webhookId}`,
        queryParams: { api_key: apiKey },
      });
    } catch {
      // Webhook deletion failed, ignore error
    }

    await context.store.delete('webhook_id');
  },
  async run(context) {
    const payload = context.payload.body;

    try {
      // Validate webhook payload
      const validatedPayload = ConversationWebhookSchema.parse(payload);
      return [validatedPayload];
    } catch {
      return [];
    }
  },
});
