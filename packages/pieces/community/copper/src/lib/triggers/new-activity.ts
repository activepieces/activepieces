import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

const CACHE_KEY = 'copper_new_activity_webhook';

export const newActivity = createTrigger({
  auth: copperAuth,
  name: 'new_activity',
  displayName: 'New Activity',
  description: 'Fires when a new activity is logged (e.g., call, email, note)',
  props: {},
  sampleData: {
    "id": 123456,
    "type": {
      "id": 0,
      "category": "user"
    },
    "parent": {
      "id": 78901,
      "type": "person"
    },
    "details": "Called to discuss project requirements",
    "activity_date": 1640995200,
    "user_id": 12345
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      // Create webhook subscription for new activities
      const webhookData = {
        target: context.webhookUrl,
        type: 'activity_log',
        event: 'new',
        secret: {
          source: 'activepieces',
          trigger: 'new_activity'
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
    
    // Validate that this is an activity webhook notification
    if (Array.isArray(payload) && payload.length > 0) {
      // Copper sends activity IDs in an array format
      return payload.map(id => ({ activity_id: id }));
    }
    
    // Return the payload as-is if it's already structured data
    return [payload];
  },
});
