import { actualBudgetAuth } from '../..';
import { createAction } from '@activepieces/pieces-framework';
import * as api from '@actual-app/api';
import { initializeAndDownloadBudget } from '../common/common';


export const getAccounts = createAction({
  auth: actualBudgetAuth,
  name: 'get_accounts',
  displayName: 'Get Accounts',
  description: 'Get your accounts',
  props: {},
  async run(context) {
    await initializeAndDownloadBudget(api, context.auth)
    const accounts = await api.getAccounts();
    await api.shutdown();
    return accounts;
  },
});
