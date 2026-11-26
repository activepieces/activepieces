import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { parseWebhookPayload } from '../common/webhook';

const webhookSetupMarkdown = `1. Copy the webhook URL below.
2. In the [Kapso dashboard](https://app.kapso.ai), open your WhatsApp number's settings.
3. Paste it as the **Webhook destination URL**.

\`\`\`text
{{webhookUrl}}
\`\`\`
`;

export const messageStatusUpdate = createTrigger({
  auth: kapsoAuth,
  name: 'message_status_update',
  classification: 'READ',
  displayName: 'Message Status Update',
  description:
    'Triggers when a message status changes (sent, delivered, read).',
  aiMetadata: {
    description: 'Fires when a delivery-status update arrives for a previously sent WhatsApp message — sent, delivered, read, or failed. An optional status filter restricts firing to a single status; left as All, it fires on any status change. Represents the lifecycle of outbound messages, useful for tracking delivery or detecting failures.',
  },
  props: {
    setup: Property.MarkDown({
      value: webhookSetupMarkdown,
      variant: MarkdownVariant.INFO,
    }),
    statusFilter: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Fire only for this status. Leave as All for every change.',
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
  },
  async onDisable() {
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
    recipient_id: '15551234567',
    phoneNumberId: '647015955153740',
    displayPhoneNumber: '+1 555 987 6543',
  },
});
