import {
  createTrigger,
  TriggerStrategy,
  WebhookHandshakeStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';

export const updatedContactTrigger = createTrigger({
  auth: biginAuth,
  name: 'updated_contact',
  displayName: 'Updated Contact',
  description: 'Triggers when a contact is updated in Bigin CRM',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: '2034020000000489034',
    First_Name: 'John',
    Last_Name: 'Doe',
    Email: 'john.doe@example.com',
    Phone: '+1-555-123-4567',
    Mobile: '+1-555-987-6543',
    Account_Name: 'Example Company',
    Title: 'Senior Sales Manager',
    Created_Time: '2023-07-31T10:30:00+00:00',
    Modified_Time: '2023-07-31T14:45:00+00:00',
    Owner: {
      name: 'Admin User',
      id: '2034020000000457001',
      email: 'admin@example.com'
    }
  },
  async onEnable(context) {
    const client = new BiginClient(context.auth);
    
    try {
      // Create webhook for updated contacts
      const webhookData = {
        watch: [
          {
            channel_id: context.webhookUrl,
            events: ['Contacts.edit'],
            channel_type: 'web',
            notify_url: context.webhookUrl,
            token: 'bigin_webhook_token'
          }
        ]
      };

      const response = await client.makeRequest(HttpMethod.POST, '/actions/watch', undefined, webhookData);

      // Store webhook details for cleanup
      await context.store?.put('webhook_details', {
        channel_id: context.webhookUrl,
        watch_id: response.watch?.[0]?.resource_uri
      });

      console.log('Webhook created for updated contacts:', response);
    } catch (error) {
      console.error('Failed to create webhook for updated contacts:', error);
      throw error;
    }
  },
  async onDisable(context) {
    const client = new BiginClient(context.auth);

    try {
      const webhookDetails = await context.store?.get('webhook_details');

      if (webhookDetails?.watch_id) {
        // Delete the webhook
        await client.makeRequest(HttpMethod.DELETE, `/actions/watch/${webhookDetails.watch_id}`);
        console.log('Webhook deleted for updated contacts');
      }
      
      // Clean up stored data
      await context.store?.delete('webhook_details');
    } catch (error) {
      console.error('Failed to delete webhook for updated contacts:', error);
    }
  },
  async run(context) {
    const payloadBody = context.payload.body as any;
    
    // Bigin webhook payload structure
    if (payloadBody && payloadBody.data) {
      return [payloadBody.data];
    }
    
    return [];
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
    paramName: 'challenge'
  }
});
