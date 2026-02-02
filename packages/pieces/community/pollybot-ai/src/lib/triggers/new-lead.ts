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
5. Find the **Webhooks** section and  **Add Webhook**.
6. Choose the **Lead Created** event and specify the following URL:
\`\`\`text
{{webhookUrl}}
\`\`\`
7. Click Save to register the webhook.
        `,
    }),
  },
  sampleData: {
    data: {
      id: 'cmipr3rf400t3n42y5plvmhd5',
      name: 'teswwt',
      tags: [],
      email: 'teswwwt@gmail.com',
      phone: null,
      source: 'api',
      status: 'NEW',
      company: null,
      discord: null,
      message: null,
      urgency: 'low',
      priority: 'MEDIUM',
      chatbotId: 'cmipnh1je00sxn42y1j34wqnd',
      createdAt: '2025-12-03T08:34:31.696Z',
      updatedAt: '2025-12-03T08:34:31.696Z',
      customFields: null,
      preferredMethod: 'email',
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
