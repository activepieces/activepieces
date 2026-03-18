import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const cancelSubscriptionAction = createAction({
  name: 'cancel_subscription',
  auth: outsetaAuth,
  displayName: 'Cancel Subscription',
  description:
    'Cancel the current subscription on an account. By default, the subscription expires at the end of the current term. You can also cancel immediately.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
    }),
    cancelImmediately: Property.Checkbox({
      displayName: 'Cancel Immediately',
      required: false,
      defaultValue: false,
      description:
        'If checked, the subscription is cancelled immediately. Otherwise it expires at the end of the current billing term.',
    }),
    cancellationReason: Property.ShortText({
      displayName: 'Cancellation Reason',
      required: false,
      description: 'Reason for the cancellation (e.g. "Too expensive")',
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      required: false,
      description: 'Additional comment about the cancellation',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body: Record<string, unknown> = {
      Account: { Uid: context.propsValue.accountUid },
    };

    if (context.propsValue.cancellationReason) {
      body['CancelationReason'] = context.propsValue.cancellationReason;
    }
    if (context.propsValue.comment) {
      body['Comment'] = context.propsValue.comment;
    }

    // Submit cancellation request
    const result = await client.put<any>(
      `/api/v1/crm/accounts/cancellation/${context.propsValue.accountUid}`,
      body
    );

    // If cancel immediately, fetch the full account first to avoid wiping fields
    if (context.propsValue.cancelImmediately) {
      const account = await client.get<any>(
        `/api/v1/crm/accounts/${context.propsValue.accountUid}`
      );
      account.AccountStage = 6;
      await client.put<any>(
        `/api/v1/crm/accounts/${context.propsValue.accountUid}`,
        account
      );
    }

    return result;
  },
});
