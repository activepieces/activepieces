import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { createWebhook, deleteWebhook, WebhookResponse } from '../common/client';

export const subscriptionCreatedTrigger = createTrigger({
  auth: pinchPaymentsAuth,
  name: 'subscription_created',
  displayName: 'Subscription Created',
  description: 'Triggers when a subscription is created for a payer',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const credentials = {
      username: context.auth.props.username,
      password: context.auth.props.password,
    };

    const webhook = await createWebhook(credentials, {
      uri: context.webhookUrl,
      webhookFormat: 'camel-case',
      eventTypes: ['subscription-created'],
    });

    await context.store.put<WebhookResponse>('pinch_subscription_created_webhook', webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookResponse>('pinch_subscription_created_webhook');
    if (webhook) {
      const credentials = {
        username: context.auth.props.username,
        password: context.auth.props.password,
      };
      await deleteWebhook(credentials, webhook.id);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    id: 'evt_sample123456',
    type: 'subscription-created',
    eventDate: '2024-01-15T10:30:00Z',
    metadata: {},
    data: {
      subscription: {
        id: 'sub_sample123456',
        planId: 'pln_sample123456',
        planName: 'Monthly Plan',
        status: 'active',
        startDate: '2024-01-15',
        payer: {
          id: 'pyr_sample123456',
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john.doe@example.com',
        },
      },
    },
  },
});
