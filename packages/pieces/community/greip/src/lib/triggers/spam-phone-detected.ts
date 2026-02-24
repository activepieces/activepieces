import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { greipAuth } from '../common/auth';

export const spamPhoneDetectedTrigger = createTrigger({
  name: 'spam_phone_detected',
  displayName: 'Spam Phone Number Detected',
  description: 'Triggers when a new phone number is marked as SPAM by Greip',
  auth: greipAuth,
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
To use this trigger, you need to manually set up a webhook in your Greip account:

1. Login to your Greip dashboard.
2. Go to Settings > Integrations > Webhooks.
3. Click on "Add Webhook" or "Create New Webhook".
4. Add the following URL in the **Webhook URL** field:
\`\`\`text
{{webhookUrl}}
\`\`\`
5. Select **spam_phone** from the event types.
6. Click Save to create the webhook.

**Note:** Webhooks are only available for paid subscriptions.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event: 'spam_phone',
    phone: '0555123456',
    countryCode: 'ir',
    carrier: '',
    reason: 'Invalid phone number structure.',
    isValid: false,
  },
  async onEnable(context) {
    // Webhooks are set up manually in Greip dashboard
  },
  async onDisable(context) {
    // Webhooks are removed manually in Greip dashboard
  },
  async run(context) {
    return [context.payload.body];
  },
});

