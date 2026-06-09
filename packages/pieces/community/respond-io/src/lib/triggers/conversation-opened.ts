import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

import { respondIoAuth } from '../common/auth';

export const conversationOpenedTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'conversation_opened',
  displayName: 'Conversation Opened',
  description: 'Triggers when a new conversation is opened.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
          To use this trigger, you need to manually set up a webhook in your Respond.io account:
    
          1. Login to your Respond.io account.
          2. Go to Settings > Integrations > Webhooks.
          3. Click on "Add Webhook" or "Create New Webhook".
          4. Add the following URL in the **Webhook URL** field:
          \`\`\`text
          {{webhookUrl}}
          \`\`\`
          5. Select **conversation.opened** from the event types.
          6. Click Save to create the webhook.
          `,
    }),
  },

  async onEnable(context) {
    // No need to register webhooks programmatically as user will do it manually
  },

  async onDisable(context) {
    // No need to unregister webhooks as user will do it manually
  },

  async run(context) {
    const payload = context.payload.body as {
      event_type: string;
      contact: Record<string, unknown>;
      conversation: Record<string, unknown>;
    };

    if (payload.event_type !== 'conversation.opened') return [];

    return [payload];
  },

  async test() {
    return [
      {
        event_type: 'conversation.opened',
        event_id: '8b9c2905-7a38-4aad-a6b7-b9120dc140fe',
        contact: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          phone: '+60123456789',
          email: 'johndoe@sample.com',
          language: 'en',
          profilePic: 'https://cdn.chatapi.net/johndoe.png',
          countryCode: 'MY',
          status: 'open',
          assignee: {
            id: 2,
            firstName: 'John',
            lastName: 'Doe',
            email: 'johndoe@sample.com',
          },
          created_at: 1663274081,
        },
        conversation: {
          source: 'api',
          conversationOpenedAt: 1663274081,
          firstIncomingMessage: 'hello',
          firstIncomingMessageChannelId: 1,
        },
      },
    ];
  },

  sampleData: {},
});
