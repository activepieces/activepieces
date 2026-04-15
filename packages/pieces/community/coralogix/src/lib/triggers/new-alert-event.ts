import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { coralogixAuth } from '../common/auth';

export const newAlertEvent = createTrigger({
  auth: coralogixAuth,
  name: 'newAlertEvent',
  displayName: 'New Alert Event',
  description:
    'Triggers when Coralogix sends an alert-event webhook payload to this flow.',
  props: {
    setupInstructions: Property.MarkDown({
      value: `
### Webhook setup in Coralogix

1. In Coralogix, go to **Alerts** and open the alert definition you want.
2. Open **Outbound Webhooks** and click **Add webhook**.
3. Select **Generic webhook**.
4. In **Webhook URL**, paste: \`{{webhookUrl}}\`
5. Keep method as **POST** and content type as **application/json**.
6. Save the webhook, then trigger a test alert to verify events are received.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    value: '0',
    source: 'S3',
    schema: 'nginx',
    metric: '',
    log: '',
    correlationId: '',
    category: 'Security',
    applicationName: 'Critical app',
    subsystemName: 'payments',
    incidentIdentifier: 'abc123',
    alertDescription: 'check this out',
    timestamp: 1713175564848,
    tenantUrl: 'https://api.coralogix.com',
    fields: [
      {
        key: 'coralogix.metadata.timestamp',
        value: ['2024-04-15T07:26:04.848Z'],
      },
      {
        key: 'coralogix.metadata.severity',
        value: [3],
      },
      {
        key: 'ip',
        value: ['::1'],
      },
      {
        key: 'log',
        value: [
          '127.0.0.1 - - [17/May/2015:08:05:12 +0000] "GET / HTTP/1.1" 200 612 "-" "curl/7.64.1"',
        ],
      },
      {
        key: 'message',
        value: ['test'],
      },
      {
        key: 'metric',
        value: [''],
      },
      {
        key: 'region',
        value: ['us-central1'],
      },
      {
        key: 'source',
        value: ['S3'],
      },
    ],
  },
  async onEnable() {
    // Coralogix outbound webhook is configured from Coralogix UI/API.
  },
  async onDisable() {
    // Coralogix outbound webhook is configured from Coralogix UI/API.
  },
  async run(context) {
    const body = context.payload.body;

    return [body ?? context.payload];
  },
});
