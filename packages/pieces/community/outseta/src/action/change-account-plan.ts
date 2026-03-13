import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const changeAccountPlanAction = createAction({
  name: 'change_account_plan',
  auth: outsetaAuth,
  displayName: 'Change Account Plan',
  description:
    'Change an account\'s current plan to a different one (upgrade, downgrade, or switch to free)',
  props: {
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
          { label: 'Quarterly', value: 3 },
          { label: 'One-time', value: 4 },
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

    // First, get the account's current subscription UID
    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=Uid,CurrentSubscription.Uid`
    );

    if (!account.CurrentSubscription?.Uid) {
      throw new Error(
        'This account does not have an active subscription to change.'
      );
    }

    const subscriptionUid = account.CurrentSubscription.Uid;

    const result = await client.put<any>(
      `/api/v1/billing/subscriptions/${subscriptionUid}/changesubscription`,
      {
        Account: { Uid: context.propsValue.accountUid },
        Plan: { Uid: context.propsValue.planUid },
        BillingRenewalTerm: context.propsValue.billingRenewalTerm,
      }
    );

    return result;
  },
});
