import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { pollybotAuth } from '../auth';

export const newLead = createTrigger({
  auth: pollybotAuth,
  name: 'newLead',
  displayName: 'New Lead',
  description: 'Triggers when a new lead is created in PollyBot AI chatbot.',
  aiMetadata: {
    description:
      'Fires when a new lead is created in the specified PollyBot AI chatbot (the LEAD_CREATED webhook event), delivering the new lead record. Events for other chatbots are filtered out by the configured Chatbot ID.',
  },
  props: {
    chatbotid: Property.ShortText({
      displayName: 'Chatbot ID',
      description: 'The Id of the chatbot to monitor for new leads.',
      required: true,
    }),
    instruction: Property.MarkDown({
      value: `## PollyBot AI Webhook Setup
To use this trigger, you need to manually set up a webhook in your PollyBot AI account:

1. Login to your PollyBot AI account.
2. Navigate to the **Chatbots** section from the left navigation menu.
3. Select the desired chatbot for which you want to set up the webhook.
4. Go to the **Settings** tab.
5. Find the **Webhooks** section and click **Add Webhook**.
6. Choose the **Lead Created** event and specify the following URL:
\`\`\`text
{{webhookUrl}}
\`\`\`
7. Click Save to register the webhook.`,
    }),
  },
  sampleData: {
    data: {
      id: 'cmipr3rf400t3n42y5plvmhd5',
      chatbotId: 'cmipnh1je00sxn42y1j34wqnd',
      conversationId: null,
      name: 'Jane Cooper',
      email: 'jane.cooper@acme.com',
      phone: '+14155550132',
      company: 'Acme Inc.',
      message: 'Interested in the enterprise plan.',
      source: 'api',
      status: 'NEW',
      priority: 'MEDIUM',
      assignedAgentId: null,
      notes: null,
      tags: ['enterprise', 'pricing'],
      customFields: { plan: 'enterprise' },
      followUpDate: null,
      lastContactAt: null,
      convertedAt: null,
      createdAt: '2026-08-19T09:14:32.118Z',
      updatedAt: '2026-08-19T09:14:32.118Z',
      discord: null,
      preferredMethod: 'email',
      urgency: 'low',
      chatbots: {
        id: 'cmipnh1je00sxn42y1j34wqnd',
        name: 'Support Bot',
      },
    },
    event: 'LEAD_CREATED',
    chatbotId: 'cmipnh1je00sxn42y1j34wqnd',
    timestamp: 1764750871,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    const payload = context.payload.body as any;
    if (payload.data.chatbotId !== context.propsValue.chatbotid) {
      return [];
    }
    return [context.payload.body];
  },
});
