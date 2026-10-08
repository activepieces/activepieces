import { createAction } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripOutputSchemas } from '../output-schemas';

export const listAccountsAction = createAction({
  auth: dripAuth,
  name: 'list_accounts',
  displayName: 'List Accounts',
  description: 'Lists the Drip accounts this API token can access.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every Drip account the connected API token can access, with account ID, name, website and sender details. Use first when another Drip step needs an Account ID and the token may have more than one account. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: dripOutputSchemas.listAccounts,
  async run({ auth }) {
    const accounts = await dripApi.listAccounts(auth.secret_text);
    return { items: accounts };
  },
});
