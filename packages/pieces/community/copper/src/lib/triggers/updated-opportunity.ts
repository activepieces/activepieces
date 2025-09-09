import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

const CACHE_KEY = 'copper_updated_opportunity_webhook';

export const updatedOpportunity = createTrigger({
  auth: copperAuth,
  name: 'updated_opportunity',
  displayName: 'Updated Opportunity',
  description: 'Fires when an opportunity changes',
  props: {},
  sampleData: {
    "id": 123456,
    "name": "Enterprise Software License - Updated",
    "primary_contact_id": 78901,
    "primary_contact": {
      "id": 78901,
      "name": "Jane Smith",
      "email": "jane.smith@company.com"
    },
    "customer_source_id": 1,
    "customer_source": {
      "id": 1,
      "name": "Website"
    },
    "company_id": 12345,
    "company": {
      "id": 12345,
      "name": "Tech Solutions Inc"
    },
    "pipeline_id": 1,
    "pipeline": {
      "id": 1,
      "name": "Sales Pipeline"
    },
    "pipeline_stage_id": 3,
    "pipeline_stage": {
      "id": 3,
      "name": "Proposal"
    },
    "monetary_value": 150000,
    "assignee_id": 12345,
    "assignee": {
      "id": 12345,
      "name": "John Doe",
      "email": "john.doe@company.com"
    },
    "status": "Open",
    "tags": ["enterprise", "high-value", "proposal-stage"],
    "date_created": 1640995200,
    "date_modified": 1641081600,
    "date_last_contacted": 1641081600,
    "interaction_count": 5,
    "followed": true,
    "custom_fields": [
      {
        "custom_field_definition_id": 1,
        "value": "Updated contract terms"
      }
    ]
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      // Create webhook subscription for updated opportunities
      const webhookData = {
        target: context.webhookUrl,
        type: 'opportunity',
        event: 'update',
        secret: {
          source: 'activepieces',
          trigger: 'updated_opportunity'
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
    
    // Validate that this is an opportunity webhook notification
    if (Array.isArray(payload) && payload.length > 0) {
      // Copper sends opportunity IDs in an array format
      return payload.map(id => ({ opportunity_id: id }));
    }
    
    // Return the payload as-is if it's already structured data
    return [payload];
  },
});
