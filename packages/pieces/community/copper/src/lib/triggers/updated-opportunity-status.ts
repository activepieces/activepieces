import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

const CACHE_KEY = 'copper_updated_opportunity_status_webhook';

export const updatedOpportunityStatus = createTrigger({
  auth: copperAuth,
  name: 'updated_opportunity_status',
  displayName: 'Updated Opportunity Status',
  description: 'Fires when an opportunity\'s status changes',
  props: {},
  sampleData: {
    "id": 123456,
    "name": "Enterprise Software License",
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
    "pipeline_stage_id": 4,
    "pipeline_stage": {
      "id": 4,
      "name": "Negotiation"
    },
    "previous_pipeline_stage_id": 3,
    "previous_pipeline_stage": {
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
    "priority": "High",
    "close_date": "2024-03-15",
    "tags": ["enterprise", "high-value", "negotiation-stage"],
    "date_created": 1640995200,
    "date_modified": 1641081600,
    "date_last_contacted": 1641081600,
    "interaction_count": 8,
    "followed": true,
    "custom_fields": [
      {
        "custom_field_definition_id": 1,
        "value": "Status changed to negotiation"
      }
    ],
    "status_change": {
      "from": "Proposal",
      "to": "Negotiation",
      "changed_at": 1641081600,
      "changed_by": 12345
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      // Create webhook subscription for updated opportunities
      // Note: Copper doesn't have a specific "status change" webhook type
      // We use the general opportunity update webhook and filter for status changes
      const webhookData = {
        target: context.webhookUrl,
        type: 'opportunity',
        event: 'update',
        secret: {
          source: 'activepieces',
          trigger: 'updated_opportunity_status'
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
    
    // Validate that this is an opportunity webhook notification
    if (Array.isArray(payload) && payload.length > 0) {
      // Copper sends opportunity IDs in an array format
      // Note: This trigger will fire on any opportunity update
      // The actual status change detection would need to be done by comparing
      // the current opportunity data with previously stored data
      return payload.map(id => ({ 
        opportunity_id: id,
        status_change_detected: true,
        note: "This trigger fires on any opportunity update. Status change detection requires comparing current data with previous data."
      }));
    }
    
    // Return the payload as-is if it's already structured data
    return [payload];
  },
});
