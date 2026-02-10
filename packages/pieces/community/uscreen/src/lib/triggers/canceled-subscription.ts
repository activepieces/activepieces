import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { uscreenAuth } from '../common/auth';
import { uscreenProps } from '../common/props';

const sampleData = {
  event: 'subscription_canceled',
  user_id: 123456,
  user_email: 'user@example.com',
  subscription_id: 'sub_789xyz',
  subscription_title: 'Premium Plan',
  canceled_at: '2025-10-27T13:32:10Z',
  custom_fields: {
    favorite_genre: 'Comedy',
    referral_source: 'Google Ads',
  },
};

export const canceledSubscription = createTrigger({
  auth: uscreenAuth,
  name: 'canceled_subscription',
  displayName: 'Canceled Subscription',
  description:
    'Triggers when a subscription is canceled for a user.',
  props: { setupInstructions: uscreenProps.webhookInstructions() },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    //Empty
  },

  async onDisable(context) {
    //Empty
  },

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;

    if (payload.event !== 'subscription_canceled') {
      return [];
    }

    return [payload];
  },

  async test(context) {
    return [sampleData];
  },
});
