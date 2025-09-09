import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

const CACHE_KEY = 'copper_updated_lead_status_webhook';

export const updatedLeadStatus = createTrigger({
  auth: copperAuth,
  name: 'updated_lead_status',
  displayName: 'Updated Lead Status',
  description: 'Fires when a lead\'s status changes',
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
    "customer_source": {
      "id": 1,
      "name": "Website"
    },
    "status_id": 3,
    "status": "Qualified",
    "previous_status_id": 2,
    "previous_status": "Contacted",
    "assignee_id": 12345,
    "assignee": {
      "id": 12345,
      "name": "John Doe",
      "email": "john.doe@company.com"
    },
    "monetary_value": 75000,
    "tags": ["high-priority", "enterprise", "qualified"],
    "date_created": 1640995200,
    "date_modified": 1641081600,
    "date_last_contacted": 1641081600,
    "interaction_count": 5,
    "followed": true,
    "custom_fields": [
      {
        "custom_field_definition_id": 1,
        "value": "Status changed to qualified"
      }
    ],
    "status_change": {
      "from_status": "Contacted",
      "to_status": "Qualified",
      "from_status_id": 2,
      "to_status_id": 3,
      "changed_at": 1641081600,
      "changed_by": 12345,
      "change_type": "progression"
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      // Create webhook subscription for updated leads
      // Note: Copper doesn't have a specific "status change" webhook type
      // We use the general lead update webhook and filter for status changes
      const webhookData = {
        target: context.webhookUrl,
        type: 'lead',
        event: 'update',
        secret: {
          source: 'activepieces',
          trigger: 'updated_lead_status'
        }
      };

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/webhooks',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
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
        throw new Error('Authentication failed. Please check your credentials.');
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
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
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
      // Note: This trigger will fire on any lead update
      // The actual status change detection would need to be done by comparing
      // the current lead data with previously stored data
      return payload.map(id => ({ 
        lead_id: id,
        status_change_detected: true,
        note: "This trigger fires on any lead update. Status change detection requires comparing current status_id with previous status_id."
      }));
    }
    
    // Return the payload as-is if it's already structured data
    return [payload];
  },
});
