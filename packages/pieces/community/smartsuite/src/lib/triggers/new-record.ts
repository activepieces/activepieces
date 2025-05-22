import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { SmartSuiteClient } from '../common/client';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

// Define the webhook payload interface
interface SmartSuiteWebhookPayload {
  event_type: string;
  record_id?: string;
  app_id?: string;
  [key: string]: any;
}

export const newRecordTrigger = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggered when a new record is created in SmartSuite',
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
## SmartSuite Webhook Setup
SmartSuite requires webhooks to be created via API. Use this curl command (replace values):

\`\`\`
curl -X POST https://webhooks.smartsuite.com/smartsuite.webhooks.engine.Webhooks/CreateWebhook \\
  -H "Authorization: Token YOUR_API_KEY" \\
  -H "ACCOUNT-ID: YOUR_WORKSPACE_ID" \\
  -H "Content-Type: application/json" \\
  -d '{
    "filter": {"applications": {"APP_ID": {}}},
    "kinds": ["RECORD_CREATED"],
    "locator": {"workspace": "YOUR_WORKSPACE_ID"},
    "webhook_url": "{{webhookUrl}}"
  }'
\`\`\`

Replace:
- YOUR_API_KEY: Your SmartSuite API key
- YOUR_WORKSPACE_ID: Your workspace ID
- APP_ID: Your SmartSuite app ID
- {{webhookUrl}}: URL from Activepieces

Note: SmartSuite webhooks must receive payloads every 7 days to stay active.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: '1234567890',
    title: 'Sample Record',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    fields: {
      'field_1': 'Sample value',
      'field_2': 123,
    },
  },
  async onEnable(context) {
    // No action needed as webhooks are set up manually via API
  },
  async onDisable(context) {
    // No action needed as webhooks are managed manually via API
  },
  async test(context) {
    // This is a webhook trigger, so we don't need to test it by fetching data
    return [this.sampleData];
  },
  async run(context) {
    // For webhooks, extract and return the payload directly
    const payload = context.payload.body as SmartSuiteWebhookPayload;

    // Validate that this is a record created event
    if (payload.event_type !== 'record_created') {
      return [];
    }

    // If needed, fetch the complete record details using the record ID from payload
    const authValue = context.auth as { apiKey: string; workspaceId: string };
    const client = new SmartSuiteClient(authValue.apiKey, authValue.workspaceId);

    try {
      const recordId = payload.record_id;
      const appId = payload.app_id;

      if (!recordId || !appId) {
        return [payload]; // Return the webhook payload if we can't fetch details
      }

      const recordDetails = await client.getRecord(appId, recordId);
      return [recordDetails];
    } catch (error) {
      console.error('Error fetching record details:', error);
      // Return the webhook payload as fallback
      return [payload];
    }
  },
});
