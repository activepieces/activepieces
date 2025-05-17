import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { isNil } from '@activepieces/shared';
import { zagomailAuth } from '../../index';
import { buildListsDropdown } from '../common/props';

export const subscriberUnsubscribedTrigger = createTrigger({
  auth: zagomailAuth,
  name: 'subscriber_unsubscribed',
  displayName: 'Subscriber Unsubscribed',
  description: 'Triggered when a subscriber unsubscribes from a list',
  props: {
    listId: Property.Dropdown({
      displayName: 'List',
      description: 'Select the list to monitor',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => await buildListsDropdown(auth as string),
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: '12345',
    email: 'example@example.com',
    first_name: 'John',
    last_name: 'Doe',
    status: 'unsubscribed',
    unsubscribed_at: '2023-05-18T09:22:41.000000Z',
    list_id: '6789',
    event_type: 'subscriber-unsubscribe',
  },
  async onEnable(context) {
    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/webhooks/create',
      {
        event_type: 'subscriber-unsubscribe',
        target_url: context.webhookUrl,
        listId: context.propsValue.listId
      }
    ) as WebhookResponse;

    const webhookId = response.id || '';
    if (!webhookId) {
      throw new Error('Failed to get webhook ID from response');
    }

    await context.store.put<StoredWebhook>('zagomail_subscriber_unsubscribed', {
      webhookId: webhookId,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<StoredWebhook>('zagomail_subscriber_unsubscribed');
    if (!isNil(webhook) && !isNil(webhook.webhookId)) {
      await makeRequest(
        context.auth as string,
        HttpMethod.DELETE,
        `/webhooks/${webhook.webhookId}`,
        {}
      );
    }
  },
  async run(context) {
    console.log('Received webhook payload:', JSON.stringify(context.payload.body));
    return [context.payload.body];
  },
});

type WebhookResponse = {
  id?: string;
  url?: string;
  event_type?: string;
  created_at?: string;
};

type StoredWebhook = {
  webhookId: string;
};
