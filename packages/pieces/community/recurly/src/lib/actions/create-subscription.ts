import { createAction, Property } from '@activepieces/pieces-framework';
import { SubscriptionCreate } from 'recurly';
import { recurlyAuth } from '../auth';
import {
  createRecurlyClient,
  flattenRecurlyResource,
} from '../common/client';
import { accountCodeDropdown, planCodeDropdown } from '../common/props';

export const createSubscriptionAction = createAction({
  auth: recurlyAuth,
  name: 'create_subscription',
  displayName: 'Create Subscription',
  description: 'Start a new subscription for an existing Recurly account.',
  props: {
    accountCode: accountCodeDropdown(
      true,
      'Select the account that should own the subscription.',
    ),
    planCode: planCodeDropdown(
      true,
      'Select the plan for the new subscription.',
    ),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The 3-letter ISO currency code to bill in, for example USD.',
      required: true,
      defaultValue: 'USD',
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'The subscription quantity. Leave at 1 for standard subscriptions.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const requestBody: SubscriptionCreate = {
      planCode: context.propsValue.planCode,
      currency: context.propsValue.currency,
      account: {
        code: context.propsValue.accountCode,
      },
      quantity: context.propsValue.quantity ?? 1,
    };

    const subscription = await createRecurlyClient(context.auth).createSubscription(requestBody);
    return flattenRecurlyResource(subscription);
  },
});
