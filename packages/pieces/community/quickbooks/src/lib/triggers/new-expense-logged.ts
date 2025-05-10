import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../auth';
import { pollingHelper } from '../common/polling';

export const newExpenseLogged = createTrigger({
  name: 'new_expense_logged',
  displayName: 'New Expense Logged',
  description: 'Triggers when a new expense (purchase) is logged in QuickBooks',
  type: TriggerStrategy.POLLING,
  auth: quickbooksAuth,
  props: {
    max_results: Property.Number({
      displayName: 'Maximum Number of Expenses',
      description: 'Maximum number of expenses to return on each poll (default: 10, max: 1000)',
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
    "DocNumber": "1001",
    "TxnDate": "2023-01-01",
    "CurrencyRef": {
      "value": "USD",
      "name": "United States Dollar"
    },
    "PaymentType": "CreditCard",
    "EntityRef": {
      "value": "1",
      "name": "Vendor Name",
      "type": "Vendor"
    },
    "AccountRef": {
      "value": "1",
      "name": "Credit Card"
    },
    "Line": [
      {
        "Id": "1",
        "Description": "Office Supplies",
        "Amount": 120.0,
        "DetailType": "AccountBasedExpenseLineDetail",
        "AccountBasedExpenseLineDetail": {
          "AccountRef": {
            "value": "2",
            "name": "Office Expenses"
          }
        }
      }
    ],
    "TotalAmt": 120.0
  },
  
  async onEnable(context) {
    await pollingHelper.onEnable(context);
  },
  
  async onDisable(context) {
    await pollingHelper.onDisable(context);
  },
  
  async run(context) {
    const { max_results } = context.propsValue;
    
    const expenses = await pollingHelper.poll(context, {
      entityName: 'purchase',
      queryFilter: 'PaymentType IN (\'CreditCard\', \'Cash\', \'Check\')',
      orderBy: 'MetaData.LastUpdatedTime DESC',
      maxResults: max_results || 10,
    });
    
    return expenses;
  },
});
