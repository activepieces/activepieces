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
4. Message status updates will now trigger this flow.

**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
`;

export const messageStatusUpdate = createTrigger({
  auth: kapsoAuth,
  name: 'message_status_update',
  displayName: 'Message Status Update',
  description:
    'Triggers when a message status changes (sent, delivered, read).',
  props: {
    setup: Property.MarkDown({
      value: webhookSetupMarkdown,
      variant: MarkdownVariant.INFO,
    }),
    statusFilter: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Only trigger for a specific status. Leave as All to trigger for any status change.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Sent', value: 'sent' },
          { label: 'Delivered', value: 'delivered' },
          { label: 'Read', value: 'read' },
          { label: 'Failed', value: 'failed' },
        ],
      },
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

    if (parsed.statuses.length === 0) {
      return [];
    }

    const statusFilter = context.propsValue.statusFilter;
    let statuses = parsed.statuses;

    if (statusFilter && statusFilter !== 'all') {
      statuses = statuses.filter((s) => s['status'] === statusFilter);
    }

    return statuses.map((status) => ({
      ...status,
      phoneNumberId: parsed.phoneNumberId,
      displayPhoneNumber: parsed.displayPhoneNumber,
    }));
  },
  sampleData: {
    id: 'wamid.ABGGFlCGg0cvAgo-sJQh43L5Pe4W',
    status: 'delivered',
    timestamp: '1677000000',
    recipientId: '15551234567',
    phoneNumberId: '647015955153740',
    displayPhoneNumber: '+1 555 987 6543',
  },
});
