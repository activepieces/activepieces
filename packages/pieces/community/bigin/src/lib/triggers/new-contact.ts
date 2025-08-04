import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const newContact = createTrigger({
  auth: biginAuth,
  name: 'newContact',
  displayName: 'New Contact',
  description: 'Fires when a contact is added',
  props: {},
  sampleData: {
    module: 'Contacts',
    operation: 'insert',
    record: {
      id: '5555615000000346002',
      First_Name: 'John',
      Last_Name: 'Doe',
      Full_Name: 'John Doe',
      Email: 'john.doe@example.com',
      Mobile: '555-0123',
      Phone: '555-0124',
      Title: 'Sales Manager',
      Account_Name: {
        name: 'Acme Corporation',
        id: '5555615000000346003',
      },
      Mailing_Street: '123 Main St',
      Mailing_City: 'San Francisco',
      Mailing_State: 'CA',
      Mailing_Country: 'USA',
      Mailing_Zip: '94105',
      Owner: {
        name: 'Sarah Johnson',
        id: '5555615000000181017',
        email: 'sarah.johnson@example.com',
      },
      Created_Time: '2019-01-27T15:10:00+05:30',
      Modified_Time: '2019-01-27T15:10:00+05:30',
      Created_By: {
        name: 'Sarah Johnson',
        id: '5555615000000181017',
        email: 'sarah.johnson@example.com',
      },
      Modified_By: {
        name: 'Sarah Johnson',
        id: '5555615000000181017',
        email: 'sarah.johnson@example.com',
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Generate a unique channel ID
    const channelId = Date.now();

    const body = {
      watch: [
        {
          channel_id: channelId,
          events: ['Contacts.create'],
          channel_type: 'web',
          notify_url: context.webhookUrl,
          token: `TOKEN_FOR_VERIFICATION_OF_${channelId}`,
        },
      ],
    };

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/actions/watch',
      body
    );

    await context.store?.put('webhook_details', {
      channel_id: channelId,
      response: response,
    });

    return response;
  },

  async onDisable(context) {
    const webhookDetails = (await context.store?.get('webhook_details')) as {
      channel_id: string;
      response: any;
    };

    if (webhookDetails?.channel_id) {
      try {
        const endpoint = `/actions/watch?channel_ids=${webhookDetails.channel_id}`;

        await makeRequest(
          context.auth.access_token,
          HttpMethod.DELETE,
          endpoint
        );
      } catch (error) {
        console.error('Error disabling webhook:', error);
      }
    }
  },

  async run(context) {
    type ContactPayload = {
      module?: string;
      operation?: string;
      record?: {
        id?: string;
        [key: string]: any;
      };
      [key: string]: any;
    };

    let payload: ContactPayload = context.payload?.body as ContactPayload;

    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload) as ContactPayload;
      } catch (e) {
        console.log('Failed to parse payload as JSON:', e);
      }
    }

    if (payload?.module === 'Contacts') {
      return [payload];
    }
    return [];
  },
});
