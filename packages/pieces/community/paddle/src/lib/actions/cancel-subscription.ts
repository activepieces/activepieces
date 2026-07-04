import { createAction, Property } from '@activepieces/pieces-framework';

import { paddleAuth } from '../auth';
import { paddleClient } from '../common/client';
import { paddleProps } from '../common/props';
import { paddleUtils } from '../common/utils';

const cancelSubscriptionAction = createAction({
  auth: paddleAuth,
  name: 'cancel-subscription',
  displayName: 'Cancel Subscription',
  description: 'Cancels a Paddle subscription immediately or at the next billing period.',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancels a Paddle subscription by ID, applying the cancellation either immediately or at the end of the current billing period via the effective-from option. Use to end a subscription; this changes billing state and is not idempotent (repeating it on an already-canceled subscription will error or re-apply).',
    idempotent: false,
  },
  props: {
    subscriptionId: paddleProps.subscription(),
    effectiveFrom: Property.StaticDropdown({
      displayName: 'Effective From',
      description: 'Choose when Paddle should apply the cancellation.',
      required: false,
      options: {
        options: [
          {
            label: 'Immediately',
            value: 'immediately',
          },
          {
            label: 'Next Billing Period',
            value: 'next_billing_period',
          },
        ],
      },
    }),
  },
  async run(context) {
    const subscriptionId = paddleUtils.getRequiredString({
      value: context.propsValue.subscriptionId,
      fieldName: 'Subscription',
    });
    const effectiveFrom = paddleUtils.getOptionalString({
      value: context.propsValue.effectiveFrom,
    });

    return paddleClient.cancelSubscription({
      auth: context.auth,
      subscriptionId,
      request: paddleUtils.compactRecord({
        effective_from: effectiveFrom,
      }),
    });
  },
});

export { cancelSubscriptionAction };
