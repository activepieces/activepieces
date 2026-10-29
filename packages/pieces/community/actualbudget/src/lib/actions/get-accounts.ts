import { createAction } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from '../common/auth';
import { withBudget } from '../common/client';
import { actualOutputSchemas } from '../common/output-schemas';

export const getAccounts = createAction({
  auth: actualBudgetAuth,
  name: 'get_accounts',
  classification: 'SEARCH',
  displayName: 'Get Accounts',
  description: 'Gets every account in the budget (open and closed).',
  audience: 'human',
  aiMetadata: {
    description:
      'Builder version of List Accounts: returns the raw array of all accounts (id, name, offbudget, closed) without balances. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: actualOutputSchemas.accountsArray,
  async run(context) {
    return withBudget({
      auth: context.auth.props,
      fn: (api) => api.getAccounts(),
    });
  },
});
