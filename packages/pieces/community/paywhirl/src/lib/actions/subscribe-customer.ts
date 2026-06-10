import { createAction, Property } from '@activepieces/pieces-framework';
import { paywhirlAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const subscribeCustomer = createAction({
  auth: paywhirlAuth,
  name: 'subscribeCustomer',
  displayName: 'Subscribe Customer',
  description:
    'Enroll a customer in an existing plan. The customer must have a valid payment method on file.',
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Customer ID',
      required: true,
    }),
    plan_id: Property.Number({
      displayName: 'Plan ID',
      description: 'Plan ID',
      required: true,
    }),
    trial_end: Property.Number({
      displayName: 'Trial End',
      description: 'UNIX timestamp in the future (UTC timezone)',
      required: false,
    }),
    promo_id: Property.Number({
      displayName: 'Promo ID',
      description: 'ID of promo code to apply',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Quantity (Default: 1)',
      required: false,
    }),
  },
  async run(context) {
    const { customer_id, plan_id, trial_end, promo_id, quantity } =
      context.propsValue;

    const body: any = {
      customer_id,
      plan_id,
    };

    if (trial_end) body.trial_end = trial_end;
    if (promo_id) body.promo_id = promo_id;
    if (quantity) body.quantity = quantity;

    const response = await makeRequest(
      context.auth.props.api_key,
      context.auth.props.api_secret,
      HttpMethod.POST,
      '/subscribe/customer',
      body
    );

    return response;
  },
});
