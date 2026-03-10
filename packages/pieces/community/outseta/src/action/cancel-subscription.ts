import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const cancelSubscriptionAction = createAction({
  name: 'cancel_subscription',
  auth: outsetaAuth,
  displayName: 'Cancel subscription',
  description:
    'Cancel an account subscription. By default cancels at end of billing period.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
    }),
    cancelationReason: Property.LongText({
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

    const result = await client.put<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}`,
      {
        AccountCancellation: {
          CancellationReason: context.propsValue.cancelationReason ?? '',
        },
      }
    );

    return result;
  },
});
