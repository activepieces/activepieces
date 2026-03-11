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

    // Get the account to find the current subscription
    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=Uid,CurrentSubscription.Uid`
    );

    if (!account.CurrentSubscription?.Uid) {
      throw new Error(
        'This account does not have an active subscription to cancel.'
      );
    }

    // Cancel by setting the account to Canceling stage
    const result = await client.put<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}`,
      {
        AccountStage: 4, // Canceling
        AccountCancellation: {
          CancellationReason:
            context.propsValue.cancellationReason ?? '',
        },
      }
    );

    return result;
  },
});
