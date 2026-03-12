import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const changeSubscriptionPlanAction = createAction({
  name: 'change_subscription_plan',
  auth: outsetaAuth,
  displayName: 'Change subscription plan',
  description:
    'Change an existing subscription to a different plan (upgrade, downgrade, or switch to free)',
  props: {
    subscriptionUid: Property.ShortText({
      displayName: 'Subscription UID',
      required: true,
    }),
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
    }),
    planUid: Property.ShortText({
      displayName: 'New Plan UID',
      required: true,
      description: 'The UID of the plan to switch to',
    }),
    billingRenewalTerm: Property.StaticDropdown({
      displayName: 'Billing Renewal Term',
      required: true,
      defaultValue: 1,
      options: {
        disabled: false,
        options: [
          { label: 'Monthly', value: 1 },
          { label: 'Annual', value: 2 },
        ],
      },
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const result = await client.put<any>(
      `/api/v1/billing/subscriptions/${context.propsValue.subscriptionUid}/changeSubscription`,
      {
        Account: { Uid: context.propsValue.accountUid },
        Plan: { Uid: context.propsValue.planUid },
        BillingRenewalTerm: context.propsValue.billingRenewalTerm,
      }
    );

    return result;
  },
});
