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

export const newContactGroup = createTrigger({
  name: 'new_contact_group',
  displayName: 'New Contact Group',
  description: 'Fires when a new contact group is created within a contact book',
  auth: missiveAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 'group_12345678-abcd-1234-5678-1234567890ab',
    name: 'New Contact Group',
    description: 'A newly created contact group',
    color: '#10B981',
    icon: 'users',
    created_at: '2023-07-27T10:00:00+00:00',
    updated_at: '2023-07-27T10:00:00+00:00',
    contact_book: {
      id: 'contact_book_12345678-abcd-1234-5678-1234567890ab',
      name: 'Main Contact Book'
    },
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
    parent_group: null,
    child_groups: []
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${missiveCommon.baseUrl}/hooks`,
      body: {
        type: 'new_contact_group',
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
        type: 'new_contact_group'
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
        const contactGroupDetails = await missiveCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/contact_books/${payload.contact_book?.id || 'default'}/groups/${payload.id}`,
        });
        
        return [contactGroupDetails.body];
      } catch (error) {
        return [payload];
      }
    }
    
    return [payload];
  },
}); 