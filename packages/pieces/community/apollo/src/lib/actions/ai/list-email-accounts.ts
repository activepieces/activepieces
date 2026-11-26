import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiListEmailAccountsAction = createAction({
  auth: apolloAuth,
  name: 'ai_list_email_accounts',
  classification: 'SEARCH',
  displayName: 'List Email Accounts',
  description: 'List the mailboxes connected to Apollo.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the mailboxes connected to your Apollo workspace (ID, address, owner user, active, default) for the email_account_id that Add Contacts to Sequence needs. Provider credentials are never returned. Uses no credits.',
    idempotent: true,
  },
  props: {},
  outputSchema: apolloOutputSchemas.emailAccounts,
  async run({ auth }) {
    const body = await apolloRequests.listEmailAccounts({ apiKey: apiKeyOf(auth) });
    return { email_accounts: recordsOf(body['email_accounts']).map((account) => apolloMappers.emailAccount(account)) };
  },
});
