import { missiveAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { missiveCommon } from '../common/client';

export const newContactBook = createTrigger({
  name: 'new_contact_book',
  displayName: 'New Contact Book',
  description: 'Fires when a new contact book is created in Missive',
  auth: missiveAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 'contact_book_12345678-abcd-1234-5678-1234567890ab',
    name: 'New Contact Book',
    description: 'A newly created contact book',
    color: '#3B82F6',
    icon: 'book',
    created_at: '2023-07-27T10:00:00+00:00',
    updated_at: '2023-07-27T10:00:00+00:00',
    organization: {
      id: 'org_12345678-abcd-1234-5678-1234567890ab',
      name: 'Example Organization'
    },
    team: {
      id: 'team_12345678-abcd-1234-5678-1234567890ab',
      name: 'Example Team'
    },
    owner: {
      id: 'user_12345678-abcd-1234-5678-1234567890ab',
      email: 'user@example.com',
      name: 'John Doe'
    },
    is_shared: true,
    contact_count: 0,
    group_count: 0
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${missiveCommon.baseUrl}/hooks`,
      body: {
        type: 'new_contact_book',
        url: webhookUrl
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const { status } = await httpClient.sendRequest(request);
    if (status !== 200) {
      throw new Error(`Failed to register webhook. Status: ${status}`);
    }
  },

  onDisable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${missiveCommon.baseUrl}/hooks`,
      queryParams: {
        url: webhookUrl,
        type: 'new_contact_book'
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
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
        const contactBookDetails = await missiveCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/contact_books/${payload.id}`,
        });
        
        return [contactBookDetails.body];
      } catch (error) {
        return [payload];
      }
    }
    
    return [payload];
  },
}); 