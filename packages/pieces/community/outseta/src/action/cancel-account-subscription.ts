import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const cancelAccountSubscriptionAction = createAction({
  name: 'cancel_account_subscription',
  auth: outsetaAuth,
  displayName: 'Cancel Account Subscription',
  description: 'Cancel the current subscription for an account in Outseta',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
    }),
    cancellationReason: Property.LongText({
      displayName: 'Cancellation Reason',
      required: false,
      description: 'Optional reason for the cancellation',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    // Get the account to verify it has an active subscription
    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=Uid,CurrentSubscription.Uid`
    );

    if (!account.CurrentSubscription?.Uid) {
      throw new Error(
        'This account does not have an active subscription to cancel.'
      );
    }

    // Cancel via the subscription-level endpoint to ensure billing is stopped
    const subscriptionUid = account.CurrentSubscription.Uid;
    const result = await client.put<any>(
      `/api/v1/billing/subscriptions/${subscriptionUid}/cancel`,
      {
        Account: { Uid: context.propsValue.accountUid },
        CancellationReason:
          context.propsValue.cancellationReason ?? '',
      }
    );

    return result;
  },
});
