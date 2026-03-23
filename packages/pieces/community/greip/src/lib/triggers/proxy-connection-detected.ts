import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { greipAuth } from '../common/auth';

export const proxyConnectionDetectedTrigger = createTrigger({
  name: 'proxy_connection_detected',
  displayName: 'Proxy Connection Detected',
  description: 'Triggers when a new proxy connection is detected',
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
5. Select **proxy_detected** from the event types.
6. Click Save to create the webhook.

**Note:** Webhooks are only available for paid subscriptions.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event: 'proxy_detected',
    ip: '1.1.1.1',
    ipType: 'IPv4',
    IPNumber: 16843009,
    countryCode: 'US',
    countryGeoNameID: 6252001,
    countryName: 'United States',
    security: {
      isProxy: false,
      proxyType: null,
      isTor: false,
      isBot: false,
      isRelay: false,
      isHosting: false,
    },
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

