import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';
import type { ConversationEndedWebhookPayload } from '../common/types';

const assistantDropdownForConversationWebhook = () =>
  Property.Dropdown({
    auth: famulorAuth,
    displayName: 'Assistant',
    description:
      'Select the assistant whose chat conversations (WhatsApp or web widget) should send this webhook when a conversation ends',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please authenticate first',
          options: [],
        };
      }

      try {
        const allAssistants = await famulorCommon.fetchAllAssistantPages({
          auth: auth.secret_text,
        });

        if (allAssistants.length === 0) {
          return {
            disabled: true,
            placeholder: 'No assistants found. Create one first.',
            options: [],
          };
        }

        return {
          options: allAssistants.map((assistant: any) => ({
            label: `${assistant.name} (${assistant.type} - ${assistant.status})`,
            value: assistant.id,
          })),
        };
      } catch {
        return {
          disabled: true,
          placeholder: 'Failed to fetch assistants',
          options: [],
        };
      }
    },
  });

export const conversationEnded = createTrigger({
  auth: famulorAuth,
  name: 'conversationEnded',
  displayName: 'Conversation Ended',
  description: 'Triggers when a chat conversation ends.',
  props: {
    assistant_id: assistantDropdownForConversationWebhook(),
  },
  sampleData: {
    conversation_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    assistant_id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
    type: 'widget',
    message_count: 8,
    status: 'ended',
    extracted_variables: {
      status: true,
      summary:
        'Customer asked about pricing plans and was interested in the Pro plan',
    },
    input_variables: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    transcript: [
      {
        role: 'assistant',
        content: 'Hi! How can I help you today?',
      },
      {
        role: 'user',
        content: 'I have a question about your service.',
      },
    ],
    formatted_transcript:
      'AI: Hi! How can I help you today?\nCustomer: I have a question about your service.',
    customer_phone: null,
    customer_name: 'John Doe',
    sender: null,
    created_at: '2026-02-23T09:30:00+01:00',
    ended_at: '2026-02-23T10:00:00+01:00',
  } satisfies ConversationEndedWebhookPayload,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await famulorCommon.enableConversationEndedWebhook({
      auth: context.auth.secret_text,
      assistant_id: context.propsValue.assistant_id as number,
      webhook_url: context.webhookUrl,
    });
  },
  async onDisable(context) {
    await famulorCommon.disableConversationEndedWebhook({
      auth: context.auth.secret_text,
      assistant_id: context.propsValue.assistant_id as number,
    });
  },
  async run(context) {
    return [context.payload.body];
  },
});
