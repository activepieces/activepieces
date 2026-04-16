import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { billsbyAuth, BillsbyAuthType } from '../auth';
import { billsbyRequest } from '../common/client';

export const createSubscriptionAction = createAction({
  auth: billsbyAuth,
  name: 'create_subscription',
  displayName: 'Create Subscription',
  description: 'Create a new subscription for a customer in Billsby.',
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The unique ID of the customer.',
      required: true,
    }),
    plan_code: Property.ShortText({
      displayName: 'Plan Code',
      description: 'The code of the plan to subscribe to.',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Number of units to subscribe.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { customer_id, plan_code, quantity } = context.propsValue;

    return await billsbyRequest({
      auth: context.auth as BillsbyAuthType,
      method: HttpMethod.POST,
      path: '/subscriptions',
      body: {
        customerUniqueId: customer_id,
        planCode: plan_code,
        ...(quantity ? { quantity } : {}),
      },
    });
  },
});
