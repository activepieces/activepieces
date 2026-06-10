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
    priceId: paddleProps.recurringPrice(),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Optional quantity for the recurring price.',
      required: false,
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
    const items = {
      price_id: context.propsValue.priceId,
      quantity: context.propsValue.quantity,
    };
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
