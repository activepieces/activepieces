import { createAction, Property } from '@activepieces/pieces-framework';

import { paddleAuth } from '../auth';
import { paddleClient } from '../common/client';
import { paddleProps } from '../common/props';
import { paddleUtils } from '../common/utils';

const updateSubscriptionAction = createAction({
  auth: paddleAuth,
  name: 'update-subscription',
  displayName: 'Update Subscription',
  description:
    'Updates a Paddle subscription. Send the full recurring item list you want the subscription to keep.',
  props: {
    subscriptionId: paddleProps.subscription(),
    items: Property.Json({
      displayName: 'Items',
      description:
        'Provide the complete recurring item list as JSON, for example `[{"price_id":"pri_...","quantity":1}]`.',
      required: true,
    }),
    prorationBillingMode: Property.StaticDropdown({
      displayName: 'Proration Billing Mode',
      description: 'How Paddle should bill for the subscription change.',
      required: false,
      options: {
        options: [
          {
            label: 'Prorated Immediately',
            value: 'prorated_immediately',
          },
          {
            label: 'Full Immediately',
            value: 'full_immediately',
          },
          {
            label: 'Prorated Next Billing Period',
            value: 'prorated_next_billing_period',
          },
          {
            label: 'Full Next Billing Period',
            value: 'full_next_billing_period',
          },
          {
            label: 'Do Not Bill',
            value: 'do_not_bill',
          },
        ],
      },
    }),
    customData: Property.Json({
      displayName: 'Custom Data',
      description: 'Optional JSON object to store on the subscription.',
      required: false,
    }),
  },
  async run(context) {
    const subscriptionId = paddleUtils.getRequiredString({
      value: context.propsValue.subscriptionId,
      fieldName: 'Subscription',
    });
    const items = paddleUtils.getLineItems({
      value: context.propsValue.items,
      fieldName: 'Items',
    });
    const prorationBillingMode = paddleUtils.getOptionalString({
      value: context.propsValue.prorationBillingMode,
    });
    const customData = paddleUtils.getOptionalObject({
      value: context.propsValue.customData,
      fieldName: 'Custom Data',
    });

    return paddleClient.updateSubscription({
      auth: context.auth,
      subscriptionId,
      request: paddleUtils.compactRecord({
        custom_data: customData,
        items,
        proration_billing_mode: prorationBillingMode,
      }),
    });
  },
});

export { updateSubscriptionAction };
