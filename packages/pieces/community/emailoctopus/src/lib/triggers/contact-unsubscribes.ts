import { emailoctopusAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { emailoctopusCommon } from '../common/client';

export const contactUnsubscribes = createTrigger({
  name: 'contact_unsubscribes',
  displayName: 'Contact Unsubscribes',
  description: 'Fires when a contact unsubscribes from a list',
  auth: emailoctopusAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to monitor for unsubscribes',
      required: true,
    }),
  },
  sampleData: {
    id: '00000000-0000-0000-0000-000000000000',
    email_address: 'john.doe@example.com',
    status: 'unsubscribed',
    unsubscribed_at: '2023-07-27T10:00:00+00:00',
    list_id: '00000000-0000-0000-0000-000000000000'
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const listId = context.propsValue.list_id;

    await emailoctopusCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/webhooks',
      body: {
        url: webhookUrl,
        events: ['contact.unsubscribed'],
        list_id: listId
      }
    });
  },

  onDisable: async (context) => {
  },

  run: async (context) => {
    const payload = context.payload.body as any;
    return [payload];
  },
});
