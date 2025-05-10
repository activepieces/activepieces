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
    custom_fields: {
      company: 'Acme Inc.',
    },
    list_id: '6789',
    event_type: 'subscriber.created',
  },
  async onEnable(context) {
    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/webhooks',
      {
        url: context.webhookUrl,
        event_type: 'subscriber.created',
        list_id: context.propsValue.listId,
      }
    ) as WebhookResponse;

    await context.store.put<StoredWebhook>('zagomail_webhook', {
      webhookId: response.id,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<StoredWebhook>('zagomail_webhook');
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
    return [context.payload.body];
  },
});

type WebhookResponse = {
  id: string;
  url: string;
  event_type: string;
  created_at: string;
};

type StoredWebhook = {
  webhookId: string;
};
