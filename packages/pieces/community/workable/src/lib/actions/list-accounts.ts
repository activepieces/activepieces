import { createAction } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { listAccounts as fetchAccounts, tokenOf } from '../common/client';
import { workableSchemas } from '../common/schemas';

export const listAccounts = createAction({
  auth: workableAuth,
  name: 'list_accounts',
  classification: 'READ',
  displayName: 'List Accounts',
  description: 'Lists the Workable accounts this token can use, with their subdomains.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the Workable accounts the connected token can access, with name and subdomain. Steps use the first account unless Account Subdomain is filled, so call this when the token may cover several accounts. Read-only.',
    idempotent: true,
  },
  outputSchema: workableSchemas.accounts,
  props: {},
  async run(context) {
    const accounts = await fetchAccounts(tokenOf(context.auth));
    return { accounts, count: accounts.length };
  },
});
