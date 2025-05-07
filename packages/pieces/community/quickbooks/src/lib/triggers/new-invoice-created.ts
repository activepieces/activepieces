import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth, QuickbooksAuthType } from '../auth';
import { pollingHelper } from '../common/polling-helper';
import { QuickbooksInvoice } from '../types';

export const newInvoiceCreated = createTrigger({
  name: 'new_invoice_created',
  displayName: 'New Invoice Created',
  description: 'Triggers when a new invoice is created in QuickBooks',
  type: TriggerStrategy.POLLING,
  auth: quickbooksAuth,
  props: {
    include_paid: Property.Checkbox({
      displayName: 'Include Paid Invoices',
      description: 'If checked, both paid and unpaid invoices will trigger the flow. Otherwise, only unpaid invoices will trigger.',
      required: false,
      defaultValue: true,
    }),
    max_results: Property.Number({
      displayName: 'Maximum Number of Invoices',
      description: 'Maximum number of invoices to return on each poll (default: 10, max: 1000)',
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
    "CustomField": [],
    "DocNumber": "1001",
    "TxnDate": "2023-01-01",
    "CurrencyRef": {
      "value": "USD",
      "name": "United States Dollar"
    },
    "LinkedTxn": [],
    "Line": [
      {
        "Id": "1",
        "LineNum": 1,
        "Description": "Consulting Services",
        "Amount": 500.0,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": {
            "value": "1",
            "name": "Consulting"
          },
          "Qty": 5,
          "UnitPrice": 100
        }
      }
    ],
    "CustomerRef": {
      "value": "1",
      "name": "John Doe"
    },
    "CustomerMemo": {
      "value": "Thank you for your business"
    },
    "BillEmail": {
      "Address": "john.doe@example.com"
    },
    "TotalAmt": 500.0,
    "Balance": 500.0
  },

  async onEnable(context) {
    await pollingHelper.onEnable(context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(context);
  },

  async run(context) {
    const { include_paid, max_results } = context.propsValue;

    // Build query filter based on props
    const queryFilter = [];
    if (!include_paid) {
      queryFilter.push('Balance > 0');
    }

    return await pollingHelper.poll<QuickbooksInvoice>(context, {
      entityName: 'Invoice',
      queryFilter,
      orderBy: 'MetaData.LastUpdatedTime DESC',
      maxResults: Math.min(max_results || 10, 1000),
    });
  },

  async test(context) {
    const { include_paid, max_results } = context.propsValue;

    // Build query filter based on props
    const queryFilter = [];
    if (!include_paid) {
      queryFilter.push('Balance > 0');
    }

    return await pollingHelper.test<QuickbooksInvoice>(context, {
      entityName: 'Invoice',
      queryFilter,
      orderBy: 'MetaData.LastUpdatedTime DESC',
      maxResults: Math.min(max_results || 5, 10),
    });
  }
});
