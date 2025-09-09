import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

const CACHE_KEY = 'copper_updated_task_webhook';

export const updatedTask = createTrigger({
  auth: copperAuth,
  name: 'updated_task',
  displayName: 'Updated Task',
  description: 'Fires when a task is updated',
  props: {},
  sampleData: {
    "id": 123456,
    "name": "Follow up with client - Updated",
    "related_resource": {
      "id": 78901,
      "type": "person"
    },
    "assignee_id": 12345,
    "assignee": {
      "id": 12345,
      "name": "John Doe",
      "email": "john.doe@company.com"
    },
    "due_date": 1641168000,
    "reminder_date": 1641081600,
    "completed_date": null,
    "priority": "high",
    "status": "In Progress",
    "details": "Updated: Call the client to discuss project requirements and next steps. Added urgency due to deadline approaching.",
    "date_created": 1640995200,
    "date_modified": 1641081600,
    "custom_fields": [
      {
        "custom_field_definition_id": 1,
        "value": "Updated priority level"
      }
    ]
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      // Create webhook subscription for updated tasks
      const webhookData = {
        target: context.webhookUrl,
        type: 'task',
        event: 'update',
        secret: {
          source: 'activepieces',
          trigger: 'updated_task'
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
    
    // Validate that this is a task webhook notification
    if (Array.isArray(payload) && payload.length > 0) {
      // Copper sends task IDs in an array format
      return payload.map(id => ({ task_id: id }));
    }
    
    // Return the payload as-is if it's already structured data
    return [payload];
  },
});
