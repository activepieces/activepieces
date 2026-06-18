import { createAction } from '@activepieces/pieces-framework';

import { paddleAuth } from '../auth';
import { paddleClient } from '../common/client';
import { paddleProps } from '../common/props';
import { paddleUtils } from '../common/utils';

const getSubscriptionAction = createAction({
  auth: paddleAuth,
  name: 'get-subscription',
  displayName: 'Get Subscription',
  description: 'Retrieves a Paddle subscription by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Paddle subscription by its subscription ID (sub_...) to inspect its status, items, and customer. Use when you already have the subscription ID and need its current details. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    subscriptionId: paddleProps.subscription(),
  },
  async run(context) {
    const subscriptionId = paddleUtils.getRequiredString({
      value: context.propsValue.subscriptionId,
      fieldName: 'Subscription',
    });

    return paddleClient.getSubscription({
      auth: context.auth,
      subscriptionId,
    });
  },
});

export { getSubscriptionAction };
