import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BEEHIIV_API_URL, beehiivAuth, publicationIdProperty } from '../common';

export const userUnsubscribes = createTrigger({
  name: 'user_unsubscribes',
  displayName: 'User Unsubscribes',
  description: 'Triggers when a user unsubscribes from the list',
  type: TriggerStrategy.WEBHOOK,
  auth: beehiivAuth,
  props: {
    publication_id: publicationIdProperty,
  },
  async onEnable(context) {
    const { publication_id } = context.propsValue;
    const webhookUrl = context.webhookUrl;

    // Register webhook with beehiiv
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BEEHIIV_API_URL}/publications/${publication_id}/webhooks`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        url: webhookUrl,
        event_types: ['subscription.deleted'],
      },
    });

    // Store webhook ID for later deletion
    await context.store.put('webhook_id', response.body.data.id);
  },
  async onDisable(context) {
    const { publication_id } = context.propsValue;
    const webhookId = await context.store.get('webhook_id');

    if (webhookId) {
      // Delete webhook from beehiiv
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${BEEHIIV_API_URL}/publications/${publication_id}/webhooks/${webhookId}`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
        },
      });
    }
  },
  async run(context) {
    // The webhook payload from beehiiv
    const payload = context.payload.body as {
      event_type: string;
      data: unknown;
    };

    // Check if this is a subscription.deleted event
    if (payload.event_type === 'subscription.deleted') {
      return [payload.data];
    }

    return [];
  },
  sampleData: {
    "created": 1666800076,
    "email": "john.doe@example.com",
    "id": "sub_00000000-0000-0000-0000-000000000000",
    "referral_code": "ABC123",
    "referring_site": "https://www.blog.com",
    "status": "active",
    "subscription_tier": "premium",
    "subscription_premium_tier_names": [
      "Premium",
      "Pro"
    ],
    "stripe_customer_id": "cus_00000000000000",
    "utm_campaign": "Q1 Campaign",
    "utm_channel": "website",
    "utm_medium": "organic",
    "utm_source": "Twitter"
  },
});
