import { createAction } from '@activepieces/pieces-framework';
import { letmepostAuth } from '../common/auth';
import { letmepostCommon } from '../common';
import { accountOutputSchema } from '../common/output-schemas';

export const getAccount = createAction({
  auth: letmepostAuth,
  name: 'get_account',
  classification: 'READ',
  displayName: 'Get an Account',
  description: 'Retrieve one connected social account',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one connected account by its letmepost account id, including platform, display name, profile, token expiry and the Pinterest default board when present. Use List Accounts to find account ids. Idempotent, a read-only lookup.',
    idempotent: true,
  },
  props: {
    accountId: letmepostCommon.accountDropdown({
      displayName: 'Account',
      description: 'The connected account. You can also map an account id from List Accounts.',
    }),
  },
  outputSchema: accountOutputSchema,
  async run(context) {
    return letmepostCommon.getAccount({ auth: context.auth, accountId: context.propsValue.accountId });
  },
});
