import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { getClient } from '../common';

export const stripeCancelSubscriptionAi = createAction({
  name: 'cancel_subscription_ai',
  auth: stripeAuth,
  displayName: 'Cancel Subscription (Agent)',
  description:
    'Cancel a subscription immediately or at the end of the billing period.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Cancels an existing Stripe subscription by its ID, either immediately or scheduled to end at the close of the current billing period (via Cancel at Period End). Use to stop recurring billing. Idempotent: re-running on an already-canceled subscription leaves it canceled.',
    idempotent: true,
  },
  props: {
    subscription: Property.ShortText({
      displayName: 'Subscription ID',
      description:
        'The Stripe subscription ID (e.g., sub_...). Obtain it from List/Search Subscriptions.',
      required: true,
    }),
    cancel_at_period_end: Property.Checkbox({
      displayName: 'Cancel at Period End',
      description:
        'If true, the subscription stays active until the end of the current billing period. If false, it cancels immediately.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { subscription, cancel_at_period_end } = context.propsValue;

    const client = getClient(context.auth.secret_text);

    if (cancel_at_period_end) {
      return await client.subscriptions.update(subscription, {
        cancel_at_period_end: true,
      });
    } else {
      return await client.subscriptions.cancel(subscription);
    }
  },
});
