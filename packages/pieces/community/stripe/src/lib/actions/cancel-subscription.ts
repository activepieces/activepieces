import { createAction, Property } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { stripeCommon, getClient } from '../common';

export const stripeCancelSubscription = createAction({
  name: 'cancel_subscription',
  auth: stripeAuth,
  displayName: 'Cancel Subscription',
  description:
    'Cancel an existing subscription, either immediately or at the end of the current billing period.',
  props: {
    subscription: stripeCommon.subscription,
    cancel_at_period_end: Property.Checkbox({
      displayName: 'Cancel at Period End',
      description:
        'If true, the subscription remains active until the end of the current billing period. If false, it cancels immediately.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { subscription, cancel_at_period_end } = context.propsValue;

    const client = getClient(context.auth);

    if (cancel_at_period_end) {
      return await client.subscriptions.update(subscription, {
        cancel_at_period_end: true,
      });
    } else {
      return await client.subscriptions.cancel(subscription);
    }
  },
});
