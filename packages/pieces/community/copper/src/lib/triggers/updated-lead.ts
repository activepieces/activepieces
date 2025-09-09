import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

const CACHE_KEY = 'copper_updated_lead_webhook';

export const updatedLead = createTrigger({
  auth: copperAuth,
  name: 'updated_lead',
  displayName: 'Updated Lead',
  description: 'Fires when a lead is modified',
  props: {},
  sampleData: {
    "id": 123456,
    "name": "Jane Smith",
    "emails": [
      {
        "email": "jane.smith@example.com",
        "category": "work"
      }
    ],
    "phone_numbers": [
      {
        "number": "+1-555-987-6543",
        "category": "mobile"
      }
    ],
    "address": {
      "street": "456 Oak Avenue",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "United States"
    },
    "company_name": "Tech Solutions Inc",
    "customer_source_id": 1,
    "status_id": 2,
    "status": "Qualified",
    "assignee_id": 12345,
    "monetary_value": 75000,
    "tags": ["high-priority", "enterprise", "qualified"],
    "date_created": 1640995200,
    "date_modified": 1641081600,
    "date_last_contacted": 1641081600,
    "interaction_count": 3,
    "followed": true,
    "custom_fields": [
      {
        "custom_field_definition_id": 1,
        "value": "Updated value"
      }
    ]
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      // Create webhook subscription for updated leads
      const webhookData = {
        target: context.webhookUrl,
        type: 'lead',
        event: 'update',
        secret: {
          source: 'activepieces',
          trigger: 'updated_lead'
        }
      };

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/webhooks',
        headers: {
          'X-PW-AccessToken': context.auth.apiKey,
          'X-PW-Application': 'developer_api',
          'X-PW-UserEmail': context.auth.userEmail,
          'Content-Type': 'application/json',
        },
        body: webhookData,
      });

      if (response.status === 200) {
        // Store webhook ID for cleanup
        await context.store.put(CACHE_KEY, response.body.id);
      } else {
        throw new Error(`Failed to create webhook: ${response.status}`);
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Bad request: ${JSON.stringify(error.response.body)}`);
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key and user email.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Please check your permissions.');
      }
      throw new Error(`Error creating webhook: ${error.message}`);
    }
  },
  async onDisable(context) {
    try {
      const webhookId = await context.store.get(CACHE_KEY);
      if (!webhookId) return;

      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.copper.com/developer_api/v1/webhooks/${webhookId}`,
        headers: {
          'X-PW-AccessToken': context.auth.apiKey,
          'X-PW-Application': 'developer_api',
          'X-PW-UserEmail': context.auth.userEmail,
          'Content-Type': 'application/json',
        },
      });

      await context.store.delete(CACHE_KEY);
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      // Don't throw error on cleanup failure
    }
  },
  async run(context) {
    const payload = context.payload.body;
    
    // Validate that this is a lead webhook notification
    if (Array.isArray(payload) && payload.length > 0) {
      // Copper sends lead IDs in an array format
      return payload.map(id => ({ lead_id: id }));
    }
    
    // Return the payload as-is if it's already structured data
    return [payload];
  },
});
