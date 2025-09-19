import { emailoctopusAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { emailoctopusCommon } from '../common/client';

export const newContact = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is added to a particular list',
  auth: emailoctopusAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to monitor for new contacts',
      required: true,
    }),
  },
  sampleData: {
    id: '00000000-0000-0000-0000-000000000000',
    email_address: 'john.doe@example.com',
    fields: {
      first_name: 'John',
      last_name: 'Doe'
    },
    tags: ['newsletter'],
    status: 'subscribed',
    created_at: '2023-07-27T10:00:00+00:00',
    last_updated_at: '2023-07-27T10:00:00+00:00'
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const listId = context.propsValue.list_id;

    const response = await emailoctopusCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/webhooks',
      body: {
        url: webhookUrl,
        events: ['contact.created'],
        list_id: listId
      }
    });

    if (response.status !== 201) {
      throw new Error(`Failed to register webhook. Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
    }
  },

  onDisable: async (context) => {
    const webhookUrl = context.webhookUrl;

    // Note: EmailOctopus doesn't have a direct way to unregister webhooks by URL
    // In a real implementation, you might need to store webhook IDs and delete them
    // For now, we'll just log a warning
    console.warn('EmailOctopus webhook unregister not implemented - webhooks need to be manually removed from dashboard');
  },

  run: async (context) => {
    const payload = context.payload.body as any;
    return [payload];
  },
});
