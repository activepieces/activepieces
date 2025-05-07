import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../auth';
import { pollingHelper } from '../common/polling';

export const newBankTransaction = createTrigger({
  name: 'new_bank_transaction',
  displayName: 'New Bank Transaction',
  description: 'Triggers when a new bank transaction is added in QuickBooks',
  type: TriggerStrategy.POLLING,
  auth: quickbooksAuth,
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'The ID of the bank account to monitor (optional)',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Maximum Number of Transactions',
      description: 'Maximum number of transactions to return on each poll (default: 10, max: 1000)',
      required: false,
      defaultValue: 10,
    }),
  },
  sampleData: {
    "Id": "123",
    "SyncToken": "0",
    "MetaData": {
      "CreateTime": "2023-01-01T12:00:00Z",
      "LastUpdatedTime": "2023-01-01T12:00:00Z"
    },
    "TxnDate": "2023-01-01",
    "CurrencyRef": {
      "value": "USD",
      "name": "United States Dollar"
    },
    "PrivateNote": "Bank deposit",
    "TxnType": "Deposit",
    "Line": [
      {
        "Id": "1",
        "Description": "Customer payment",
        "Amount": 1000.0,
        "DetailType": "DepositLineDetail",
        "DepositLineDetail": {
          "AccountRef": {
            "value": "1",
            "name": "Checking Account"
          }
        }
      }
    ],
    "DepositToAccountRef": {
      "value": "1",
      "name": "Checking Account"
    },
    "TotalAmt": 1000.0
  },
  
  async onEnable(context) {
    await pollingHelper.onEnable(context);
  },
  
  async onDisable(context) {
    await pollingHelper.onDisable(context);
  },
  
  async run(context) {
    const { account_id, max_results } = context.propsValue;
    
    // Build the query filter based on the account ID
    let queryFilter = undefined;
    if (account_id) {
      queryFilter = `DepositToAccountRef.value = '${account_id}'`;
    }
    
    // Get recent bank transactions (deposits)
    const deposits = await pollingHelper.poll(context, {
      entityName: 'deposit',
      queryFilter,
      orderBy: 'MetaData.LastUpdatedTime DESC',
      maxResults: max_results || 10,
    });
    
    return deposits;
  },
});
