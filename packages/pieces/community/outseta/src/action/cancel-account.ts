import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const cancelAccountAction = createAction({
  name: 'cancel_account',
  auth: outsetaAuth,
  displayName: 'Cancel Account',
  description:
    'Submit a cancellation request for an account. The account must be in the subscribing stage. At subscription renewal, the subscription will end and the account will be set to expired.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
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

    return await client.put<any>(
      `/api/v1/crm/accounts/cancellation/${context.propsValue.accountUid}`,
      body
    );
  },
});
