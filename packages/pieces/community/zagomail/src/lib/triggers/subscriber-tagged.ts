import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { isNil } from '@activepieces/shared';
import { zagomailAuth } from '../../index';
import { buildListsDropdown } from '../common/props';

export const subscriberTaggedTrigger = createTrigger({
  auth: zagomailAuth,
  name: 'subscriber_tagged',
  displayName: 'Subscriber Tagged',
  description: 'Triggered when a subscriber is tagged',
  props: {
    listId: Property.Dropdown({
      displayName: 'List',
      description: 'Select the list to monitor',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => await buildListsDropdown(auth as string),
    }),
    tagId: Property.ShortText({
      displayName: 'Tag ID',
      description: 'The ID of the tag to monitor',
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
    tag: 'VIP',
    tagged_at: '2023-05-18T09:22:41.000000Z',
    list_id: '6789',
    event_type: 'tag-added',
  },
  async onEnable(context) {
    const payload = {
      event_type: 'tag-added',
      target_url: context.webhookUrl,
      listId: context.propsValue.listId,
      tagId: context.propsValue.tagId
    };

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/webhooks/create',
      payload
    ) as WebhookResponse;

    const webhookId = response.id || '';
    if (!webhookId) {
      throw new Error('Failed to get webhook ID from response');
    }

    await context.store.put<StoredWebhook>('zagomail_subscriber_tagged', {
      webhookId: webhookId,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<StoredWebhook>('zagomail_subscriber_tagged');
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
