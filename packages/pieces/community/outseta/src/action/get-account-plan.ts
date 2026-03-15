import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getAccountPlanAction = createAction({
  name: 'get_account_plan',
  auth: outsetaAuth,
  displayName: 'Get Account Plan',
  description:
    'Retrieve the current plan and subscription details for an account',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=Uid,Name,CurrentSubscription.*,CurrentSubscription.Plan.*,CurrentSubscription.Plan.PlanFamily.*,CurrentSubscription.SubscriptionAddOns.*,CurrentSubscription.SubscriptionAddOns.AddOn.*`
    );

    return {
      accountUid: context.propsValue.accountUid,
      accountName: account.Name,
      currentSubscription: account.CurrentSubscription,
    };
  },
});
