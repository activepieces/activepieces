import {
  createTrigger,
  TriggerStrategy,
  WebhookHandshakeStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';

export const newPipelineRecordTrigger = createTrigger({
  auth: biginAuth,
  name: 'new_pipeline_record',
  displayName: 'New Pipeline Record',
  description: 'Triggers when a new pipeline record (deal) is created in Bigin CRM',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: '2034020000000703001',
    Deal_Name: 'Adventure Tour Package',
    Amount: 2000,
    Stage: 'Qualification',
    Closing_Date: '2023-08-15',
    Contact_Name: {
      name: 'John Doe',
      id: '2034020000000489034'
    },
    Account_Name: {
      name: 'Example Company',
      id: '2034020000000489159'
    },
    Pipeline: {
      name: 'Sales - Marketing',
      id: '2034020000000095023'
    },
    Sub_Pipeline: 'Sales Pipeline Standard',
    Created_Time: '2023-07-31T10:30:00+00:00',
    Modified_Time: '2023-07-31T10:30:00+00:00',
    Owner: {
      name: 'Admin User',
      id: '2034020000000457001',
      email: 'admin@example.com'
    }
  },
  async onEnable(context) {
    const client = new BiginClient(context.auth);
    
    try {
      // Create webhook for new pipeline records
      const webhookData = {
        watch: [
          {
            channel_id: context.webhookUrl,
            events: ['Pipelines.create'],
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

      console.log('Webhook created for new pipeline records:', response);
    } catch (error) {
      console.error('Failed to create webhook for new pipeline records:', error);
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
        console.log('Webhook deleted for new pipeline records');
      }
      
      // Clean up stored data
      await context.store?.delete('webhook_details');
    } catch (error) {
      console.error('Failed to delete webhook for new pipeline records:', error);
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
