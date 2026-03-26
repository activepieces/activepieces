import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const deleteAccountAction = createAction({
  name: 'delete_account',
  auth: outsetaAuth,
  displayName: 'Delete Account',
  description: 'Delete an account from Outseta CRM.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'The UID of the account to delete.',
      required: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    await client.delete<unknown>(`/api/v1/crm/accounts/${context.propsValue.accountUid}`);

    return { deleted: true, account_uid: context.propsValue.accountUid };
  },
});
