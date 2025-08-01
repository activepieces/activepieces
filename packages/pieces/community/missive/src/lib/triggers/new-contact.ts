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

export const newContact = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is added to a contact book',
  auth: missiveAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 'contact_12345678-abcd-1234-5678-1234567890ab',
    first_name: 'John',
    last_name: 'Doe',
    middle_name: 'Michael',
    phonetic_first_name: 'JON',
    phonetic_last_name: 'DOH',
    phonetic_middle_name: 'MIKE',
    prefix: 'Mr.',
    suffix: 'Jr.',
    nickname: 'Johnny',
    file_as: 'Doe, John Michael Jr.',
    notes: 'Important client contact',
    starred: false,
    gender: 'male',
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
      name: 'Jane Smith'
    },
    infos: [
      {
        kind: 'email',
        label: 'Work',
        value: 'john.doe@example.com'
      },
      {
        kind: 'phone',
        label: 'Mobile',
        value: '+1-555-123-4567'
      }
    ],
    memberships: [
      {
        title: 'Manager',
        location: 'New York',
        group: {
          kind: 'company',
          name: 'Example Corp'
        }
      }
    ]
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${missiveCommon.baseUrl}/hooks`,
      body: {
        type: 'new_contact',
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
        type: 'new_contact'
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
        const contactDetails = await missiveCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/contacts/${payload.id}`,
        });
        
        return [contactDetails.body];
      } catch (error) {
        return [payload];
      }
    }
    
    return [payload];
  },
}); 