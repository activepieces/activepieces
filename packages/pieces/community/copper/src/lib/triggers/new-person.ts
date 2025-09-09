import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

const CACHE_KEY = 'copper_new_person_webhook';

export const newPerson = createTrigger({
  auth: copperAuth,
  name: 'new_person',
  displayName: 'New Person',
  description: 'Fires when a new person/contact is created',
  props: {},
  sampleData: {
    "id": 123456,
    "name": "John Doe",
    "emails": [
      {
        "email": "john.doe@example.com",
        "category": "work"
      }
    ],
    "phone_numbers": [
      {
        "number": "+1-555-123-4567",
        "category": "mobile"
      }
    ],
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94105",
      "country": "United States"
    },
    "company_id": 78901,
    "company_name": "Acme Corp",
    "title": "Software Engineer",
    "contact_type_id": 1,
    "tags": ["lead", "potential-customer"],
    "date_created": 1640995200,
    "date_modified": 1640995200,
    "custom_fields": []
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      // Create webhook subscription for new persons
      const webhookData = {
        target: context.webhookUrl,
        type: 'person',
        event: 'new',
        secret: {
          source: 'activepieces',
          trigger: 'new_person'
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
    
    // Validate that this is a person webhook notification
    if (Array.isArray(payload) && payload.length > 0) {
      // Copper sends person IDs in an array format
      return payload.map(id => ({ person_id: id }));
    }
    
    // Return the payload as-is if it's already structured data
    return [payload];
  },
});
