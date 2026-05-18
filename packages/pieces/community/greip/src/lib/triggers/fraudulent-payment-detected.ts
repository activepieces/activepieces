import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { greipAuth } from '../common/auth';

export const fraudulentPaymentDetectedTrigger = createTrigger({
  name: 'fraudulent_payment_detected',
  displayName: 'Fraudulent Payment Detected',
  description: 'Triggers when a new fraudulent payment is detected by Greip',
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
5. Select **fraud_payment** from the event types.
6. Click Save to create the webhook.

**Note:** Webhooks are only available for paid subscriptions.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event: 'fraud_payment',
    customer_id: 'UID123',
    customer_email: 'name@domain.com',
    customer_phone: '0555123456',
    score: 31.666666666666664,
    rules: [
      {
        id: 'PF10001',
        description: 'High purchase rate, according to `customer_ip`.',
      },
      {
        id: 'PF10002',
        description: 'High purchase rate, according to `customer_id`.',
      },
    ],
    rulesChecked: 6,
    rulesDetected: 2,
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

