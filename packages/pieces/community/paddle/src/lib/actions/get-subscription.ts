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
