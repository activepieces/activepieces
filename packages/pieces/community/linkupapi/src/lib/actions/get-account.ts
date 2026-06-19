import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupGet } from '../common';

export const getAccount = createAction({
  auth: linkupAuth,
  name: 'get_account',
  displayName: 'Get Account Details',
  description: 'Get detailed information and status for a specific connected account. Free (0 credits).',
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'The account to retrieve (from "List Accounts")',
      required: true,
    }),
  },
  async run(context) {
    const { accountId } = context.propsValue;
    return linkupGet(
      context.auth.secret_text,
      `/accounts/${encodeURIComponent(accountId)}`
    );
  },
});
