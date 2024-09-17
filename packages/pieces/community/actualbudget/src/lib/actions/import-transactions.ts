import { actualBudgetAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import * as api from '@actual-app/api';
import { initializeAndDownloadBudget } from '../common/common';

export const importTransactions = createAction({
  auth: actualBudgetAuth,
  name: 'import_transactions',
  displayName: 'Import Transactions',
  description: 'Import Transactions',
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'ID of the account you want to import a transaction to',
      required: true,
    }),
    transactions: Property.Json({
        displayName: 'Transactions',
        description: 'A json array of the transaction object',
        required: true,
        defaultValue: [{"payee_name": "Kroger", "date": "2026-12-25", "amount": 1200 }]
    })    
  },

  async run({ auth, propsValue: { account_id, transactions } }) {  
    await initializeAndDownloadBudget(api, auth)   
    const res = await api.importTransactions(account_id, transactions);
    await api.shutdown();
    return res;
  },
});
