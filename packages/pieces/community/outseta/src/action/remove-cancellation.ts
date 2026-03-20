import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const removeCancellationAction = createAction({
  name: 'remove_cancellation',
  auth: outsetaAuth,
  displayName: 'Remove Cancellation',
  description:
    'Remove a pending cancellation request from an account, keeping the subscription active.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
      description: 'The UID of the account whose cancellation should be removed.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    await client.put<any>(
      `/api/v1/crm/accounts/removecancellation/${context.propsValue.accountUid}`,
      {}
    );

    return {
      account_uid: context.propsValue.accountUid,
      cancellation_removed: true,
    };
  },
});
