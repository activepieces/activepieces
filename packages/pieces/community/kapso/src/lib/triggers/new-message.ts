import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { kapsoAuth } from '../common';
import { parseWebhookPayload } from '../common/webhook';

const webhookSetupMarkdown = `**Setup Instructions:**

1. Copy the **Webhook URL** below.
2. Go to your [Kapso dashboard](https://app.kapso.ai) and open your WhatsApp number settings.
3. Paste the URL as your **Webhook destination URL**.
4. Incoming WhatsApp events will now trigger this flow.

**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
`;

export const newMessage = createTrigger({
  auth: kapsoAuth,
  name: 'new_message_received',
  displayName: 'New Message Received',
  description:
    'Triggers when a new WhatsApp message is received.',
  props: {
    setup: Property.MarkDown({
      value: webhookSetupMarkdown,
      variant: MarkdownVariant.INFO,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // Webhook is configured manually in the Kapso dashboard
  },
  async onDisable() {
    // Webhook is removed manually in the Kapso dashboard
  },
  async run(context) {
    const body = context.payload.body;
    const parsed = parseWebhookPayload(body);

    if (parsed.messages.length === 0) {
      return [];
    }

    return parsed.messages.map((message) => ({
      ...message,
      phoneNumberId: parsed.phoneNumberId,
      displayPhoneNumber: parsed.displayPhoneNumber,
      contacts: parsed.contacts,
    }));
  },
  sampleData: {
    id: 'wamid.ABGGFlCGg0cvAgo-sJQh43L5Pe4W',
    type: 'text',
    timestamp: '1677000000',
    from: '15551234567',
    text: {
      body: 'Hello, I need help with my order.',
    },
    phoneNumberId: '647015955153740',
    displayPhoneNumber: '+1 555 987 6543',
    contacts: [
      {
        profile: { name: 'John Doe' },
        wa_id: '15551234567',
      },
    ],
  },
});
