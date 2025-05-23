import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { instantlyAiAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { makeRequest } from '../common/client';

interface InstantlyLeadWebhookPayload {
  timestamp: string;
  event_type: string;
  campaign_name: string;
  workspace: string;
  campaign_id: string;
  lead_email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  website?: string;
  phone?: string;
  [key: string]: any;
}

export const newLeadAddedTrigger = createTrigger({
  auth: instantlyAiAuth,
  name: 'new_lead_added',
  displayName: 'New Lead Added',
  description: 'Triggers when a new lead is added to a campaign',
  props: {
    md: Property.MarkDown({
      value: `
      To use this trigger, manually set up a webhook in Instantly.ai:

      1. Go to Instantly settings
      2. Navigate to Integrations tab and find webhooks
      3. Click "Add Webhook"
      4. Enter the webhook URL provided below:
          \`\`\`text
          {{webhookUrl}}
          \`\`\`
      5. Select the campaign and event type "Email Sent"
      5. Click "Add Webhook"
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    timestamp: "2023-08-22T15:45:30.123Z",
    event_type: "email_sent",
    campaign_name: "Product Demo Campaign",
    workspace: "workspace_123456",
    campaign_id: "campaign_789012",
    lead_email: "contact@example.com",
    firstName: "John",
    lastName: "Doe",
    companyName: "Example Inc",
    website: "example.com",
    phone: "+1234567890"
  },
  async onEnable(context) {
    // Empty
  },
  async onDisable(context) {
    // Empty
  },
  async run(context) {
    return [context.payload.body];
  },
});
