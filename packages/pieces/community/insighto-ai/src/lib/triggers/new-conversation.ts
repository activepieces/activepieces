import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ConversationItem {
  id: string;
  widget_id: string;
  assistant_id: string;
  assistant_name?: string;
  attributes?: string;
  first_message?: string;
  device_type?: string;
  created_at: string;
  updated_at: string;
  chat_count: number;
  includes_voice: boolean;
  intent_name?: string;
  contact_id: string;
  contact_first_name?: string;
  contact_last_name?: string;
  summary?: string;
  widget_type?: string;
  widget_provider?: string;
}

export const newConversation = createTrigger({
  name: 'new_conversation',
  displayName: 'New Conversation',
  description: 'Fires when a new conversation is created (requires Assistant ID)',
  props: {
    assistant_id: Property.ShortText({
      displayName: 'Assistant ID',
      description: 'The UUID of the assistant to monitor for new conversations',
      required: true,
    }),
    date_from: Property.DateTime({
      displayName: 'Date From',
      description: 'Start date for conversation filtering (ISO format)',
      required: true,
    }),
    date_to: Property.DateTime({
      displayName: 'Date To',
      description: 'End date for conversation filtering (ISO format)',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to start checking from',
      required: false,
      defaultValue: 1,
    }),
    size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of conversations to check per page (max 100)',
      required: false,
      defaultValue: 50,
    }),
  },
  sampleData: {
    id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    widget_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    assistant_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    assistant_name: 'Customer Support Assistant',
    attributes: '{}',
    first_message: 'Hello, I need help with my order',
    device_type: 'web',
    created_at: '2023-11-07T05:31:56Z',
    updated_at: '2023-11-07T05:31:56Z',
    chat_count: 5,
    includes_voice: false,
    intent_name: 'order_support',
    contact_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    contact_first_name: 'John',
    contact_last_name: 'Doe',
    summary: 'Customer inquired about order status',
    widget_type: 'chat',
    widget_provider: 'web'
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    // Initialize with empty seen conversations
    await context.store.put('seen_conversations', []);
  },
  async onDisable(context) {
    await context.store.delete('seen_conversations');
  },
  async run(context) {
    const apiKey = context.auth as string;
    const assistantId = context.propsValue['assistant_id'];
    const dateFrom = context.propsValue['date_from'];
    const dateTo = context.propsValue['date_to'];
    const page = context.propsValue['page'] || 1;
    const size = context.propsValue['size'] || 50;

    const url = `https://api.insighto.ai/api/v1/conversation`;

    const queryParams: Record<string, string> = {
      api_key: apiKey,
      assistant_id: assistantId,
      date_from: new Date(dateFrom).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      date_to: new Date(dateTo).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      page: page.toString(),
      size: size.toString(),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      queryParams,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.body.data;
    if (!data || !data.items) {
      return [];
    }

    // Get previously seen conversation IDs
    const seenConversations = (await context.store.get<string[]>('seen_conversations')) || [];

    // Find new conversations that haven't been seen before
    const newConversations: ConversationItem[] = [];
    const currentConversationIds: string[] = [];

    for (const conversation of data.items) {
      const conversationId = conversation.id;
      currentConversationIds.push(conversationId);

      if (!seenConversations.includes(conversationId)) {
        newConversations.push(conversation);
      }
    }

    // Update the store with all current conversation IDs (to avoid processing old conversations again)
    await context.store.put('seen_conversations', currentConversationIds);

    return newConversations;
  },
});
