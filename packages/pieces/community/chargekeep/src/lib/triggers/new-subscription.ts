import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { chargekeepCommon } from '../common/common';
import { chargekeepAuth } from '../..';

export const newSubscription = createTrigger({
  auth: chargekeepAuth,
  name: 'new_subscription',
  displayName: 'New Subscription',
  description: 'Triggers when a new subscription is created or updated',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    amount: 100,
    contactId: 3994,
    endDate: '2024-06-30T09:29:43.6271352Z',
    eventTime: '2024-05-30T09:29:43',
    eventType: 'Subscription.CreatedOrUpdated',
    name: 'Me Spacial',
    statusId: 'A',
  },

  async onEnable(context) {
    const webhookId = await chargekeepCommon.subscribeWebhook(
      'Subscription.CreatedOrUpdated',
      context.auth.base_url,
      context.auth.api_key,
      context.webhookUrl
    );

    await context.store?.put<WebhookInformation>('_new_subscription_trigger', {
      webhookId: webhookId,
    });
  },

  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_new_subscription_trigger'
    );

    if (response !== null && response !== undefined) {
      await chargekeepCommon.unsubscribeWebhook(
        context.auth.base_url,
        context.auth.api_key,
        response.webhookId
      );
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});

interface WebhookInformation {
  webhookId: number;
}
