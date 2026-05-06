import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { discountDropdown } from '../common/dropdowns';

export const addDiscountToSubscriptionAction = createAction({
  name: 'add_discount_to_subscription',
  auth: outsetaAuth,
  displayName: 'Apply Discount to Account',
  description:
    'Apply a discount coupon to the current subscription of an account.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
      description: 'The UID of the account whose subscription will receive the discount.',
    }),
    discountUid: discountDropdown(),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    // Fetch the account to get the current subscription UID
    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=CurrentSubscription.*`
    );

    const subscriptionUid = account?.CurrentSubscription?.Uid;
    if (!subscriptionUid) {
      throw new Error(
        `Account ${context.propsValue.accountUid} does not have an active subscription.`
      );
    }

    const result = await client.post<any>(
      `/api/v1/billing/subscriptions/${subscriptionUid}/discounts/${context.propsValue.discountUid}`,
      {}
    );

    return result;
  },
});
