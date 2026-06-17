import { actualBudgetAuth } from '../..';
import { createAction } from '@activepieces/pieces-framework';
import * as api from '@actual-app/api';
import { initializeAndDownloadBudget } from '../common/common';


export const getAccounts = createAction({
  auth: actualBudgetAuth,
  name: 'get_accounts',
  displayName: 'Get Accounts',
  description: 'Get your accounts',
  audience: 'both',
  aiMetadata: { description: 'Lists all accounts from an Actual Budget server. Use it to discover available accounts and their IDs, typically to resolve the account ID required by the import-transaction actions. Takes no input; read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    await initializeAndDownloadBudget(api, context.auth.props)
    const accounts = await api.getAccounts();
    await api.shutdown();
    return accounts;
  },
});
