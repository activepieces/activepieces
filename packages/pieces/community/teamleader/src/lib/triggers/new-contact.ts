import { teamleaderAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { teamleaderCommon } from '../common/client';

export const newContact = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  auth: teamleaderAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: '12345678-abcd-1234-5678-1234567890ab',
    first_name: 'John',
    last_name: 'Doe',
    emails: [
      {
        type: 'primary',
        email: 'john.doe@example.com'
      }
    ],
    telephones: [
      {
        type: 'mobile',
        number: '+1234567890'
      }
    ],
    website: 'https://www.example.com',
    addresses: [
      {
        type: 'primary',
        address: {
          line_1: '123 Main St',
          postal_code: '12345',
          city: 'New York',
          country: 'US'
        }
      }
    ],
    language: 'en',
    gender: 'male',
    birthdate: '1980-01-01',
    tags: ['customer', 'new'],
    created_at: '2023-07-27T10:00:00+00:00',
    updated_at: '2023-07-27T10:00:00+00:00'
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${teamleaderCommon.baseUrl}/webhooks.register`,
      body: {
        url: webhookUrl,
        types: ['contact.added']
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const { status } = await httpClient.sendRequest(request);
    if (status !== 204) {
      throw new Error(`Failed to register webhook. Status: ${status}`);
    }
  },
  onDisable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${teamleaderCommon.baseUrl}/webhooks.unregister`,
      body: {
        url: webhookUrl,
        types: ['contact.added']
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      await httpClient.sendRequest(request);
    } catch (error) {
      console.warn('Failed to unregister webhook:', error);
    }
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    if (payload?.id) {
      try {
        const contactDetails = await teamleaderCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.POST,
          resourceUri: '/contacts.info',
          body: { id: payload.id }
        });
        
        return [contactDetails.body.data];
      } catch (error) {
        return [payload];
      }
    }
    
    return [payload];
  },
});
