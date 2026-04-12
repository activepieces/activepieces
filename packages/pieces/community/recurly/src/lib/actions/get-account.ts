import { createAction } from '@activepieces/pieces-framework';
import { recurlyAuth } from '../auth';
import {
  createRecurlyClient,
  flattenRecurlyResource,
} from '../common/client';
import { accountCodeDropdown } from '../common/props';

export const getAccountAction = createAction({
  auth: recurlyAuth,
  name: 'get_account',
  displayName: 'Get Account',
  description: 'Retrieve details for a billing account in Recurly.',
  props: {
    accountCode: accountCodeDropdown(
      true,
      'Select the account you want to retrieve.',
    ),
  },
  async run(context) {
    const account = await createRecurlyClient(context.auth).getAccount(
      `code-${context.propsValue.accountCode}`,
    );

    return flattenRecurlyResource(account);
  },
});
