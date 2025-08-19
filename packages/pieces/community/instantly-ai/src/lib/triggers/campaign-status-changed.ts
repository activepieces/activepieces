import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { instantlyAiAuth } from '../../index';

export const campaignStatusChangedTrigger = createTrigger({
  auth: instantlyAiAuth,
  name: 'campaign_status_changed',
  displayName: 'Campaign Status Changed',
  description: 'Triggers when a campaign status changes (completed, paused, etc.).',
  props: {
    md: Property.MarkDown({
      value: `
      To use this trigger, manually set up a webhook in Instantly.ai:

      1. Go to Instantly settings.
      2. Navigate to Integrations tab and find webhooks.
      3. Click "Add Webhook".
      4. Enter the webhook URL provided below:
          \`\`\`text
          {{webhookUrl}}
          \`\`\`
      5. Select the campaign and event type "Campaign Completed".
      6. Click "Add Webhook".
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    timestamp: "2023-08-22T15:45:30.123Z",
    event_type: "campaign_completed",
    campaign_name: "Product Demo Campaign",
    workspace: "workspace_123456",
    campaign_id: "campaign_789012"
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
