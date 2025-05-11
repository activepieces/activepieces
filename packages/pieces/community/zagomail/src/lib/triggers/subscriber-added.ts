import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { isNil } from '@activepieces/shared';
import { zagomailAuth } from '../../index';

export const subscriberAddedTrigger = createTrigger({
  auth: zagomailAuth,
  name: 'subscriber_added',
  displayName: 'Subscriber Added',
  description: 'Triggered when a new subscriber is added to a list',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to monitor',
      required: true,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: '12345',
    email: 'example@example.com',
    first_name: 'John',
    last_name: 'Doe',
    status: 'subscribed',
    created_at: '2023-05-18T09:22:41.000000Z',
    list_id: '6789',
    event_type: 'subscriber-activate',
  },
  async onEnable(context) {
    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/webhooks/create',
      {
        event_type: 'subscriber-activate',
        target_url: context.webhookUrl,
        listId: context.propsValue.listId
      }
    ) as WebhookResponse;

    const webhookId = response.id || '';
    if (!webhookId) {
      throw new Error('Failed to get webhook ID from response');
    }

    console.log('Ankit logging webhookId', webhookId);
    await context.store.put<StoredWebhook>('zagomail_subscriber_added', {
      webhookId: webhookId,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<StoredWebhook>('zagomail_subscriber_added');
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
