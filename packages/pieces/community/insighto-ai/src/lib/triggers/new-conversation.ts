import {
  createTrigger,
  Property,
  TriggerStrategy,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

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

const props = {
  assistant_id: Property.Dropdown({
    displayName: 'Assistant',
    description: 'Select the assistant to monitor for new conversations',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first'
        };
      }

      try {
        const apiKey = auth as string;
        const url = `https://api.insighto.ai/api/v1/assistant`;

        const queryParams: Record<string, string> = {
          api_key: apiKey,
          page: '1',
          size: '100', // Get more assistants for better UX
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
          return {
            disabled: true,
            options: [],
            placeholder: 'No assistants found'
          };
        }

        const options = data.items.map((item: any) => ({
          label: `${item.name || 'Unnamed Assistant'} (${item.assistant_type} - ${item.llm_model})`,
          value: item.id,
        }));

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load assistants'
        };
      }
    },
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
};

const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const apiKey = auth as string;
    const assistantId = propsValue.assistant_id as unknown as string;
    const dateFrom = propsValue.date_from as unknown as string;
    const dateTo = propsValue.date_to as unknown as string;
    const page = propsValue.page || 1;
    const size = propsValue.size || 50;

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

    return data.items.map((conversation: ConversationItem) => ({
      id: conversation.id,
      data: conversation,
    }));
  },
};

export const newConversation = createTrigger({
  name: 'new_conversation',
  displayName: 'New Conversation',
  description: 'Fires when a new conversation is created (requires Assistant ID)',
  props,
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
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth: auth as string, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth: auth as string, propsValue });
  },
  async run(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, { store, auth: auth as string, propsValue, files });
  },
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, { store, auth: auth as string, propsValue, files });
  },
});
