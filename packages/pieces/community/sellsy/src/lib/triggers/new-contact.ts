import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newContact = createTrigger({
  auth: sellsyAuth,
  name: 'newContact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is created in Sellsy',
  props: {},
  sampleData: {
    id: 12345,
    civility: 'mr',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    website: 'https://example.com',
    phone_number: '+1234567890',
    mobile_number: '+1234567891',
    position: 'Manager',
    note: 'Sample contact note',
    is_archived: false,
    owner_id: 1,
    created: '2024-01-01T00:00:00+00:00',
    updated: '2024-01-01T00:00:00+00:00'
  },
  type: TriggerStrategy.WEBHOOK,
  
  async onEnable(context) {
    const { auth, webhookUrl } = context;
    
    // Based on the webhook events response, the correct event ID for contact creation is "people.created"
    const contactEventId = 'people.created';
    
    console.log('Using contact event ID:', contactEventId);
    
    const webhookData = {
      is_enabled: true,
      endpoint: webhookUrl,
      type: 'http',
      object_in_payload: true,
      json_content_type: true,
      configuration: [
        {
          id: contactEventId,
          is_enabled: true
        }
      ]
    };

    try {
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.POST,
        '/webhooks',
        webhookData
      );

      await context.store?.put('webhook_id', response.id);
      
    } catch (error: any) {
      console.error('Failed to create webhook:', error);
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  },

  async onDisable(context) {
    const { auth } = context;
    const webhookId = await context.store?.get('webhook_id');
    
    if (webhookId) {
      try {
        await makeRequest(
          auth.access_token,
          HttpMethod.DELETE,
          `/webhooks/${webhookId}`
        );
      } catch (error) {
        console.error('Failed to delete webhook:', error);
      }
    }
  },

  async run(context) {
    return [context.payload.body];
  }
});