import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { insightoAiAuth } from '../common/auth';

interface WebhookInformation {
  webhookId: string;
}

interface Assistant {
  id: string;
  name: string;
}
interface WebhookPayload {
  event?: string;
  data?: {
    assistant_id?: string;
    chat_count?: number;
  };
}

export const newConversation = createTrigger({
  auth: insightoAiAuth,
  name: 'new_conversation',
  displayName: 'New Conversation',
  description:
    'Fires when a new conversation is created for a specific assistant.',
  props: {
    assistant_id: Property.Dropdown({
      displayName: 'Assistant',
      description: 'Select the assistant to monitor for new conversations.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Insighto.ai account first.',
            options: [],
          };
        }
        const response = await httpClient.sendRequest<{
          data: { items: Assistant[] };
        }>({
          method: HttpMethod.GET,
          url: 'https://api.insighto.ai/v1/assistant',
          headers: {
            Authorization: `Bearer ${auth as string}`,
          },
        });
        const options = response.body.data.items.map((assistant) => ({
          label: assistant.name,
          value: assistant.id,
        }));
        return {
          disabled: false,
          options: options,
        };
      },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    object: 'event',
    event: 'conversation.updated',
    created_at: '2025-09-14T15:30:10Z',
    data: {
      conversation_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      widget_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      assistant_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      device_type: 'desktop',
      contact_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      chat_count: 1, 
      transcript: [{ message: 'First message in the conversation.' }],
      attributes: {},
    },
  },

  async onEnable(context) {
    const response = await httpClient.sendRequest<{ data: { id: string } }>({
      method: HttpMethod.POST,
      url: 'https://api.insighto.ai/v1/outbound_webhook',
      headers: { Authorization: `Bearer ${context.auth}` },
      body: {
        endpoint: context.webhookUrl,
        name: `Activepieces - New Conversation Trigger`,
        enabled: true,
      },
    });
    await context.store.put<WebhookInformation>('insighto_new_conversation', {
      webhookId: response.body.data.id,
    });
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      'insighto_new_conversation'
    );
    if (webhookInfo?.webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.insighto.ai/v1/outbound_webhook/${webhookInfo.webhookId}`,
        headers: { Authorization: `Bearer ${context.auth}` },
      });
    }
  },

  async run(context) {
    const payload = context.payload.body as WebhookPayload;

    const isUpdateEvent = payload.event === 'conversation.updated';
    const isNewConversation = payload.data?.chat_count === 1;
    const isCorrectAssistant =
      payload.data?.assistant_id === context.propsValue.assistant_id;

    if (isUpdateEvent && isNewConversation && isCorrectAssistant) {
      return [context.payload.body];
    }

    return [];
  },
});
