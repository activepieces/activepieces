import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { chargekeepCommon } from '../common/common';
import { chargekeepAuth } from '../..';

export const newSubscription = createTrigger({
  auth: chargekeepAuth,
  name: 'new_subscription',
  displayName: 'New Subscription',
  description: 'Triggers when a new subscription is created',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    eventType: 'Subscription.CreatedOrUpdated',
    contactId: 3994,
    fullname: 'Frank Micheal',
    email: 'tray@sperse.com',
    id: '536778',
    name: 'Subscription_Name',
    startDate: '2024-06-30T09:29:43.6271352Z',
    endDate: '2025-06-30T09:29:43.6271352Z',
    amount: 100,
    frequency: 'Annual',
    trialDayCount: '4',
    gracePeriodCount: '10',
    statusId: 'A',
    cancelationReason: '',
    eventTime: '2024-09-06T00:29:07',
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
